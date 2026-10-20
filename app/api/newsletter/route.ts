import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { z } from "zod"
import { getContent } from "@/lib/content/server"
import { sendNewsletterEmail } from "@/lib/newsletter"

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

    const email = parsed.data.email.toLowerCase()
    const adminDb = createAdminClient()

    // Already subscribed: nothing to do, and no second welcome email.
    const { data: existing } = await adminDb
      .from("newsletter_subscribers")
      .select("id, is_subscribed")
      .eq("email", email)
      .maybeSingle()
    if (existing?.is_subscribed) {
      return NextResponse.json({ success: true })
    }

    const { data: row, error } = await adminDb
      .from("newsletter_subscribers")
      .upsert({ email, is_subscribed: true }, { onConflict: "email" })
      .select("id")
      .single()

    if (error || !row) {
      console.error("Newsletter subscribe error:", error)
      return NextResponse.json(
        { error: "Failed to subscribe. Please try again." },
        { status: 500 },
      )
    }

    // Welcome email for new (or returning) subscribers. Best-effort: the
    // subscription stands even if the email fails.
    try {
      const content = await getContent("newsletter")
      await sendNewsletterEmail({
        to: email,
        subscriberId: row.id,
        subject: content.welcomeSubject,
        title: content.welcomeSubject,
        message: content.welcomeBody,
      })
    } catch (e) {
      console.error("Newsletter welcome email failed:", e)
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
