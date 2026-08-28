import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { COD_METHOD_VALUE } from "@/lib/utils/constants"
import { notifyAdminsNewOrder } from "@/lib/mail/admin-notify"
import { z } from "zod"

const codSchema = z.object({
  orderId: z.string().uuid(),
})

/**
 * Place a Cash-on-Delivery order. Unlike MoMo, there's no gateway call: we just
 * record an unpaid payment against the order (provider `manual`, status
 * `pending`, tagged as cash_on_delivery). The order stays `pending` and stock is
 * left untouched until an admin marks it paid on delivery (see mark-paid), which
 * mirrors the successful-payment side effects.
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

    const body = await request.json()
    const parsed = codSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      )
    }
    const { orderId } = parsed.data

    // Verify the order belongs to this user and is still pending.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total, currency, status, customer_id, shipping_address")
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
      .select("id, status")
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
        provider_metadata: { method: COD_METHOD_VALUE },
      })
      .select("id, status")
      .single()

    if (paymentError) {
      return NextResponse.json(
        { error: "Failed to place order" },
        { status: 500 },
      )
    }

    // The order is now genuinely placed — notify admins (best-effort).
    const shipping = (order.shipping_address || {}) as { full_name?: string }
    await notifyAdminsNewOrder({
      id: order.id,
      order_number: order.order_number,
      total: order.total,
      currency: order.currency,
      customerName: shipping.full_name,
    })

    return NextResponse.json({ paymentId: payment.id, status: payment.status })
  } catch (error) {
    console.error("COD order error:", error)
    return NextResponse.json(
      { error: "Failed to place order" },
      { status: 500 },
    )
  }
}
