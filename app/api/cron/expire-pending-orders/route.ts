import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ordersToKeep } from "@/lib/utils/order-expiry"

export const dynamic = "force-dynamic"

// Cancel abandoned checkouts: orders left `pending` (created at "Continue to
// Payment") for more than STALE_HOURS that were never placed or paid. Orders
// awaiting the store (Cash on Delivery, MoMo transfer) are kept — see below.
//
// Secured for Vercel Cron: set CRON_SECRET in the project env and Vercel sends
// it as `Authorization: Bearer <CRON_SECRET>`.
const STALE_HOURS = 24

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createAdminClient()
  const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000).toISOString()

  // Candidate stale pending orders.
  const { data: candidates, error } = await db
    .from("orders")
    .select("id")
    .eq("status", "pending")
    .lt("created_at", cutoff)
  if (error) {
    return NextResponse.json({ error: "Query failed" }, { status: 500 })
  }
  const ids = (candidates || []).map((o) => o.id)
  if (ids.length === 0) return NextResponse.json({ cancelled: 0 })

  // Keep paid orders and orders waiting on the store (COD / MoMo transfer).
  const { data: payments } = await db
    .from("payments")
    .select("order_id, status, provider")
    .in("order_id", ids)
  const keep = ordersToKeep(payments || [])
  const toCancel = ids.filter((id) => !keep.has(id))
  if (toCancel.length === 0) return NextResponse.json({ cancelled: 0 })

  const { error: updateError } = await db
    .from("orders")
    .update({ status: "cancelled" })
    .in("id", toCancel)
  if (updateError) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  return NextResponse.json({ cancelled: toCancel.length })
}
