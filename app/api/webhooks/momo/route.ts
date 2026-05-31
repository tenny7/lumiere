import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/resend/client"
import { createHmac, timingSafeEqual } from "crypto"
import { renderOrderConfirmationEmail } from "@/lib/emails/render"

function verifyWebhookSignature(
  body: string,
  signature: string | null,
): boolean {
  const secret = process.env.MOMO_WEBHOOK_SECRET
  if (!secret || !signature) return false

  const expected = createHmac("sha256", secret).update(body).digest("hex")
  try {
    return timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(signature, "hex"),
    )
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    // Verify webhook authenticity
    const signature = request.headers.get("x-momo-signature")
    if (!verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = JSON.parse(rawBody)
    const { externalId, status, financialTransactionId, reason } = body

    if (!externalId) {
      return NextResponse.json({ error: "Missing externalId" }, { status: 400 })
    }

    const adminDb = createAdminClient()

    const { data: order } = await adminDb
      .from("orders")
      .select(
        "id, order_number, customer_id, total, shipping_address, profiles(email, full_name)",
      )
      .eq("order_number", externalId)
      .single()

    if (!order) {
      // Return 200 to prevent retries for unknown orders
      return NextResponse.json({ received: true })
    }

    const { data: payment } = await adminDb
      .from("payments")
      .select("id, status, amount")
      .eq("order_id", order.id)
      .order("initiated_at", { ascending: false })
      .limit(1)
      .single()

    if (!payment) {
      return NextResponse.json({ received: true })
    }

    // Idempotency — skip if already resolved
    if (payment.status === "successful" || payment.status === "failed") {
      return NextResponse.json({ received: true })
    }

    // Verify payment amount matches (if provided in webhook body)
    if (body.amount && Number(body.amount) !== payment.amount) {
      console.error(
        `Webhook amount mismatch: expected ${payment.amount}, got ${body.amount}`,
      )
      return NextResponse.json({ received: true })
    }

    const newStatus = status === "SUCCESSFUL" ? "successful" : "failed"

    await adminDb
      .from("payments")
      .update({
        status: newStatus,
        completed_at: new Date().toISOString(),
        provider_metadata: {
          financialTransactionId,
          reason,
          status,
        },
      })
      .eq("id", payment.id)

    if (newStatus === "successful") {
      await adminDb
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", order.id)

      // Decrement stock
      const { data: orderItems } = await adminDb
        .from("order_items")
        .select("product_id, variant_id, quantity")
        .eq("order_id", order.id)

      if (orderItems) {
        for (const item of orderItems) {
          if (item.variant_id) {
            await adminDb.rpc("decrement_variant_stock", {
              p_variant_id: item.variant_id,
              p_quantity: item.quantity,
            })
          } else {
            await adminDb.rpc("decrement_product_stock", {
              p_product_id: item.product_id,
              p_quantity: item.quantity,
            })
          }
        }
      }

      const profile = order.profiles as unknown as {
        email: string
        full_name: string
      }
      if (profile?.email) {
        try {
          // Fetch order items for the email
          const { data: emailItems } = await adminDb
            .from("order_items")
            .select("product_name, quantity, unit_price, total_price")
            .eq("order_id", order.id)

          const items = (emailItems || []).map((i) => ({
            name: i.product_name,
            quantity: i.quantity,
            unitPrice: i.unit_price,
            total: i.total_price,
          }))

          const subtotal = items.reduce((s, i) => s + i.total, 0)
          const deliveryFee = Number(order.total) - subtotal

          // Shipping address is stored as JSONB on the order
          const address = (order.shipping_address || {}) as {
            full_name?: string
            line_1?: string
            city?: string
            region?: string
          }

          const html = renderOrderConfirmationEmail({
              customerName: profile.full_name || "Customer",
              orderNumber: order.order_number,
              items,
              subtotal,
              deliveryFee: deliveryFee > 0 ? deliveryFee : 0,
              total: Number(order.total),
              shippingAddress: {
                fullName: address.full_name || profile.full_name || "",
                line1: address.line_1 || "",
                city: address.city || "",
                region: address.region || "",
              },
          })

          await resend.emails.send({
            from: EMAIL_FROM,
            replyTo: EMAIL_REPLY_TO,
            to: profile.email,
            subject: `Order Confirmed — ${order.order_number}`,
            html,
          })
        } catch (emailError) {
          console.error("Webhook: Failed to send email:", emailError)
        }
      }
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json({ received: true })
  }
}
