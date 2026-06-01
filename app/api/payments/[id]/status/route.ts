import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPaymentStatus } from "@/lib/momo/client"
import { sendMail, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/mail/client"
import { renderOrderConfirmationEmail } from "@/lib/emails/render"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get payment with order info
    const adminDb = createAdminClient()
    const { data: payment, error } = await adminDb
      .from("payments")
      .select(
        "*, orders(customer_id, order_number, total, status, shipping_address)",
      )
      .eq("id", id)
      .single()

    if (error || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (payment.orders.customer_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // If already resolved, return immediately
    if (payment.status === "successful" || payment.status === "failed") {
      return NextResponse.json({
        paymentId: payment.id,
        status: payment.status,
        completedAt: payment.completed_at,
      })
    }

    // Poll MoMo API for current status
    if (!payment.provider_reference) {
      return NextResponse.json({
        paymentId: payment.id,
        status: payment.status,
      })
    }

    const momoStatus = await getPaymentStatus(payment.provider_reference)

    if (momoStatus.status === "SUCCESSFUL" && payment.status !== "successful") {
      // Verify amount matches
      if (momoStatus.amount && Number(momoStatus.amount) !== payment.amount) {
        console.error(
          `Payment amount mismatch: expected ${payment.amount}, got ${momoStatus.amount}`,
        )
        return NextResponse.json(
          { error: "Payment amount mismatch" },
          { status: 400 },
        )
      }

      // Update payment
      await adminDb
        .from("payments")
        .update({
          status: "successful",
          completed_at: new Date().toISOString(),
          provider_metadata: momoStatus,
        })
        .eq("id", payment.id)

      // Update order status
      await adminDb
        .from("orders")
        .update({ status: "confirmed" })
        .eq("id", payment.order_id)

      // Clear the customer's cart now that the purchase is complete
      await adminDb
        .from("cart_items")
        .delete()
        .eq("profile_id", payment.orders.customer_id)

      // Decrement stock (simplified — in production use a transaction)
      const { data: orderItems } = await adminDb
        .from("order_items")
        .select("product_id, variant_id, quantity")
        .eq("order_id", payment.order_id)

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

      // Send confirmation email
      try {
        const { data: emailItems } = await adminDb
          .from("order_items")
          .select("product_name, quantity, unit_price, total_price")
          .eq("order_id", payment.order_id)

        const { data: userProfile } = await adminDb
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        const items = (emailItems || []).map((i) => ({
          name: i.product_name,
          quantity: i.quantity,
          unitPrice: i.unit_price,
          total: i.total_price,
        }))

        const subtotal = items.reduce((s, i) => s + i.total, 0)
        const orderTotal = Number(payment.orders.total)
        const deliveryFee = orderTotal - subtotal

        // Shipping address is stored as JSONB on the order
        const address = (payment.orders.shipping_address || {}) as {
          full_name?: string
          line_1?: string
          city?: string
          region?: string
        }

        const html = renderOrderConfirmationEmail({
            customerName: userProfile?.full_name || "Customer",
            orderNumber: payment.orders.order_number,
            items,
            subtotal,
            deliveryFee: deliveryFee > 0 ? deliveryFee : 0,
            total: orderTotal,
            shippingAddress: {
              fullName: address.full_name || userProfile?.full_name || "",
              line1: address.line_1 || "",
              city: address.city || "",
              region: address.region || "",
            },
        })

        await sendMail({
          from: EMAIL_FROM,
          replyTo: EMAIL_REPLY_TO,
          to: user.email!,
          subject: `Order Confirmed — ${payment.orders.order_number}`,
          html,
        })
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError)
      }

      return NextResponse.json({
        paymentId: payment.id,
        status: "successful",
        completedAt: new Date().toISOString(),
      })
    }

    if (momoStatus.status === "FAILED" && payment.status !== "failed") {
      await adminDb
        .from("payments")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          provider_metadata: momoStatus,
        })
        .eq("id", payment.id)

      return NextResponse.json({
        paymentId: payment.id,
        status: "failed",
        reason: momoStatus.reason?.message || "Payment failed",
      })
    }

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
    })
  } catch (error) {
    console.error("Payment status check error:", error)
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 },
    )
  }
}
