import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { MOMO_MANUAL_VALUE } from "@/lib/utils/constants"
import { sendMail, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/mail/client"
import { notifyAdminsManualMomo } from "@/lib/mail/admin-notify"
import { escapeHtml as esc } from "@/lib/utils/html"
import { z } from "zod"
import { redeemCoupon } from "@/lib/orders/fulfilment"

const schema = z.object({
  orderId: z.string().uuid(),
  // The number the customer sent the transfer from (helps the admin match it).
  momoPhone: z.string().trim().max(30).optional(),
})

/**
 * Manual MoMo transfer. The customer sends money to the store's published MoMo
 * number and taps "I have paid". We record an unpaid `manual` payment tagged
 * momo_manual, leave the order pending, email the store/admins to verify, and
 * email the customer a receipt-of-notice. An admin confirms via mark-paid.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }
    const { orderId, momoPhone } = parsed.data

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, order_number, total, currency, status, customer_id, shipping_address",
      )
      .eq("id", orderId)
      .single()
    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }
    if (order.customer_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "Order is not in pending state" },
        { status: 400 },
      )
    }

    const adminDb = createAdminClient()

    // Don't double-record if a payment already exists for this order.
    const { data: existingPayment } = await adminDb
      .from("payments")
      .select("id")
      .eq("order_id", orderId)
      .in("status", ["pending", "processing", "successful"])
      .maybeSingle()
    if (existingPayment) {
      return NextResponse.json(
        { error: "A payment already exists for this order" },
        { status: 409 },
      )
    }

    const { data: payment, error: paymentError } = await adminDb
      .from("payments")
      .insert({
        order_id: orderId,
        provider: "manual",
        amount: order.total,
        currency: order.currency,
        status: "pending",
        provider_metadata: {
          method: MOMO_MANUAL_VALUE,
          momo_phone: momoPhone || null,
        },
      })
      .select("id, status")
      .single()

    if (paymentError) {
      return NextResponse.json(
        { error: "Failed to record payment" },
        { status: 500 },
      )
    }

    // The order is placed: count its coupon use now (at most once).
    await redeemCoupon(adminDb, order.id)

    const shipping = (order.shipping_address || {}) as { full_name?: string }

    // Email the store/admins to verify the transfer (best-effort).
    await notifyAdminsManualMomo({
      id: order.id,
      order_number: order.order_number,
      total: order.total,
      currency: order.currency,
      customerName: shipping.full_name,
      momoPhone,
    })

    // Email the customer a receipt-of-notice (best-effort).
    if (user.email) {
      try {
        await sendMail({
          from: EMAIL_FROM,
          replyTo: EMAIL_REPLY_TO,
          to: user.email,
          subject: `Payment notice received — ${order.order_number}`,
          html: customerNoticeHtml({
            name: shipping.full_name || "there",
            orderNumber: order.order_number,
          }),
        })
      } catch (e) {
        console.error("Manual MoMo customer email failed:", e)
      }
    }

    return NextResponse.json({ paymentId: payment.id, status: payment.status })
  } catch (error) {
    console.error("Manual MoMo error:", error)
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 })
  }
}

function customerNoticeHtml({
  name,
  orderNumber,
}: {
  name: string
  orderNumber: string
}) {
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <h2 style="font-weight:500">Ajabu Lighting</h2>
    <p>Hi ${esc(name)},</p>
    <p>Thanks — we've received your payment notice for order
      <strong>${esc(orderNumber)}</strong>. Our team will confirm your MoMo
      transfer and update your order shortly. You'll get another email once it's
      confirmed.</p>
    <p style="color:#888;font-size:12px">If you haven't sent the transfer yet,
      please complete it so we can process your order.</p>
  </div>`
}
