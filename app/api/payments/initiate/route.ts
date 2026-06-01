import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requestToPay } from "@/lib/momo/client"
import { z } from "zod"

const initiateSchema = z.object({
  orderId: z.string().uuid(),
  provider: z.enum(["momo_mtn", "momo_vodafone", "momo_airteltigo"]),
  phoneNumber: z.string().regex(/^07[2-9][0-9]{7}$/, "Invalid Rwanda phone number"),
})

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
    const parsed = initiateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { orderId, provider, phoneNumber } = parsed.data

    // Verify the order belongs to this user and is pending
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, total, currency, status, customer_id")
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

    // Check for existing pending/processing payment
    const adminDb = createAdminClient()
    const { data: existingPayment } = await adminDb
      .from("payments")
      .select("id, status")
      .eq("order_id", orderId)
      .in("status", ["pending", "processing"])
      .single()

    if (existingPayment) {
      return NextResponse.json(
        { error: "A payment is already in progress for this order" },
        { status: 409 },
      )
    }

    // Initiate MoMo payment
    const { referenceId } = await requestToPay({
      amount: order.total,
      currency: order.currency,
      phoneNumber,
      externalId: order.order_number,
      payerMessage: `Payment for Ajabu Lighting order ${order.order_number}`,
      payeeNote: `Order ${order.order_number}`,
    })

    // Create payment record
    const { data: payment, error: paymentError } = await adminDb
      .from("payments")
      .insert({
        order_id: orderId,
        provider,
        provider_reference: referenceId,
        phone_number: phoneNumber,
        amount: order.total,
        currency: order.currency,
        status: "pending",
      })
      .select("id, status, provider_reference")
      .single()

    if (paymentError) {
      return NextResponse.json(
        { error: "Failed to create payment record" },
        { status: 500 },
      )
    }

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      referenceId: payment.provider_reference,
    })
  } catch (error) {
    console.error("Payment initiation error:", error)
    return NextResponse.json(
      { error: "Payment initiation failed" },
      { status: 500 },
    )
  }
}
