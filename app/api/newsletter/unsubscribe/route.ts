import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

const schema = z.object({ id: z.string().uuid() })

// POST /api/newsletter/unsubscribe — from the link in every newsletter email.
// The subscriber id (a random UUID only that subscriber receives) is the key.
// A POST from a button, never a GET, so link scanners that open email links
// can't unsubscribe people by accident.
export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid link" }, { status: 400 })
  }
  const { data, error } = await createAdminClient()
    .from("newsletter_subscribers")
    .update({ is_subscribed: false })
    .eq("id", parsed.data.id)
    .select("id")
  if (error) {
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "This link is no longer valid." }, { status: 404 })
  }
  return NextResponse.json({ unsubscribed: true })
}
