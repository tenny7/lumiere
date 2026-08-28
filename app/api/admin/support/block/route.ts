import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const schema = z.object({
  userId: z.string().uuid(),
  blocked: z.boolean(),
})

// POST /api/admin/support/block — admin toggles a customer's ability to send
// support messages. Staff/admin accounts can never be blocked.
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
  const { userId, blocked } = parsed.data

  const adminDb = createAdminClient()

  // Caller must be an admin.
  const { data: me } = await adminDb
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!me || !["admin", "super_admin"].includes(me.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Never block a staff/admin account.
  const { data: target } = await adminDb
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }
  if (blocked && target.role !== "customer") {
    return NextResponse.json(
      { error: "Staff accounts can't be blocked from messaging." },
      { status: 400 },
    )
  }

  const { error } = await adminDb
    .from("profiles")
    .update({
      support_blocked: blocked,
      support_blocked_at: blocked ? new Date().toISOString() : null,
    })
    .eq("id", userId)

  if (error) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }

  return NextResponse.json({ blocked })
}
