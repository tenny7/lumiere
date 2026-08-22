import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const schema = z.object({ orderId: z.string().uuid() })

// POST /api/support/read — mark the messages sent *to* the caller as read on
// this order's thread (a customer reads admin messages; an admin reads the
// customer's). Idempotent.
export async function POST(request: NextRequest) {
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
  const { orderId } = parsed.data

  const adminDb = createAdminClient()
  const [{ data: profile }, { data: order }] = await Promise.all([
    adminDb.from("profiles").select("role").eq("id", user.id).single(),
    adminDb.from("orders").select("customer_id").eq("id", orderId).single(),
  ])
  const isAdmin = !!profile && ["admin", "super_admin"].includes(profile.role)
  const isOwner = !!order && order.customer_id === user.id
  if (!order || (!isAdmin && !isOwner)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // The caller reads messages from the *other* party.
  const otherRole = isAdmin ? "customer" : "admin"
  await adminDb
    .from("support_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("order_id", orderId)
    .eq("sender_role", otherRole)
    .is("read_at", null)

  return NextResponse.json({ ok: true })
}
