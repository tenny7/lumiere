import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// Cancel abandoned checkouts: orders left `pending` (created at "Continue to
// Payment") for more than STALE_HOURS with no successful payment. They never
// became real orders — no confirmation email, no stock decrement — so cancelling
// keeps the orders table tidy without touching paid/confirmed orders.
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

  // Never cancel anything that actually got paid.
  const { data: paid } = await db
    .from("payments")
    .select("order_id")
    .in("order_id", ids)
    .eq("status", "successful")
  const paidSet = new Set((paid || []).map((p) => p.order_id))
  const toCancel = ids.filter((id) => !paidSet.has(id))
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
