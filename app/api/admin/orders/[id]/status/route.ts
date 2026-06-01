import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendMail, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/mail/client"
import { renderShippingNotificationEmail } from "@/lib/emails/render"
import { z } from "zod"

const schema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  trackingNumber: z.string().max(100).optional(),
  trackingCarrier: z.string().max(100).optional(),
  trackingUrl: z.string().url().max(500).optional().or(z.literal("")),
})

export async function POST(
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

    const adminDb = createAdminClient()
    const { data: profile } = await adminDb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }
    const { status, trackingNumber, trackingCarrier, trackingUrl } = parsed.data

    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    }
    // Persist tracking details (sent when marking an order shipped)
    if (trackingNumber !== undefined) updates.tracking_number = trackingNumber || null
    if (trackingCarrier !== undefined) updates.tracking_carrier = trackingCarrier || null
    if (trackingUrl !== undefined) updates.tracking_url = trackingUrl || null

    const { data: order, error } = await adminDb
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select(
        "order_number, tracking_number, tracking_carrier, tracking_url, customer:profiles(full_name, email)",
      )
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 },
      )
    }

    // Notify the customer when the order ships (best-effort).
    if (status === "shipped") {
      const customer = order.customer as unknown as {
        full_name: string
        email: string
      }
      if (customer?.email) {
        try {
          const html = renderShippingNotificationEmail({
            customerName: customer.full_name || "Customer",
            orderNumber: order.order_number,
            trackingNumber: order.tracking_number || undefined,
            trackingCarrier: order.tracking_carrier || undefined,
            trackingUrl: order.tracking_url || undefined,
          })
          await sendMail({
            from: EMAIL_FROM,
            replyTo: EMAIL_REPLY_TO,
            to: customer.email,
            subject: `Your order has shipped — ${order.order_number}`,
            html,
          })
        } catch (emailError) {
          console.error("Shipping email failed:", emailError)
        }
      }
    }

    return NextResponse.json({ success: true, status })
  } catch (error) {
    console.error("Order status update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
