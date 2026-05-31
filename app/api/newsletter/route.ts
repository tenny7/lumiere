import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"

const schema = z.object({
  email: z.string().email().max(200),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      )
    }

    const adminDb = createAdminClient()
    const { error } = await adminDb
      .from("newsletter_subscribers")
      .upsert(
        { email: parsed.data.email.toLowerCase(), is_subscribed: true },
        { onConflict: "email" },
      )

    if (error) {
      console.error("Newsletter subscribe error:", error)
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Newsletter route error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    )
  }
}
