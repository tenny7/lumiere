import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Admin-only: manually mark an order as paid. Mirrors the real payment-success
 * side effects (payment -> successful, order -> confirmed, stock decremented,
 * cart cleared) so the rest of the flow can be tested while MoMo isn't wired up.
 * Idempotent: does nothing if the order already has a successful payment.
 */
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

    const { data: order } = await adminDb
      .from("orders")
      .select("id, status, customer_id, total, currency")
      .eq("id", id)
      .single()
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const { data: payments } = await adminDb
      .from("payments")
      .select("id, status")
      .eq("order_id", id)
      .order("initiated_at", { ascending: false })

    // Idempotent — already paid.
    if ((payments || []).some((p) => p.status === "successful")) {
      return NextResponse.json({ success: true, alreadyPaid: true })
    }

    const now = new Date().toISOString()
    const latest = payments?.[0]
    if (latest) {
      await adminDb
        .from("payments")
        .update({
          status: "successful",
          completed_at: now,
          provider_metadata: { manual: true, marked_by: user.id },
        })
        .eq("id", latest.id)
    } else {
      await adminDb.from("payments").insert({
        order_id: id,
        provider: "manual",
        amount: order.total,
        currency: order.currency,
        status: "successful",
        completed_at: now,
        provider_metadata: { manual: true, marked_by: user.id },
      })
    }

    // Confirm the order if it hasn't progressed past pending.
    if (order.status === "pending") {
      await adminDb.from("orders").update({ status: "confirmed" }).eq("id", id)
    }

    // Decrement stock (this hasn't happened yet for an unpaid order).
    const { data: items } = await adminDb
      .from("order_items")
      .select("product_id, variant_id, quantity")
      .eq("order_id", id)
    for (const item of items || []) {
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

    // Clear the customer's cart, matching the real payment-success path.
    await adminDb.from("cart_items").delete().eq("profile_id", order.customer_id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mark-paid error:", error)
    return NextResponse.json(
      { error: "Failed to mark order as paid" },
      { status: 500 },
    )
  }
}
