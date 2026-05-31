import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/resend/client"
import { renderWelcomeEmail } from "@/lib/emails/render"
import { z } from "zod"

const schema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { email, name } = parsed.data

    // Only send to addresses that correspond to a real account (the signup
    // trigger creates the profile), which keeps this endpoint from being abused
    // as an open relay.
    const adminDb = createAdminClient()
    const { data: profile } = await adminDb
      .from("profiles")
      .select("full_name")
      .eq("email", email)
      .maybeSingle()

    if (!profile) {
      // Don't reveal whether the account exists.
      return NextResponse.json({ success: true })
    }

    try {
      const html = renderWelcomeEmail({
        customerName: name || profile.full_name || "there",
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://lumiere.com",
      })
      await resend.emails.send({
        from: EMAIL_FROM,
        replyTo: EMAIL_REPLY_TO,
        to: email,
        subject: "Welcome to Lumière",
        html,
      })
    } catch (emailError) {
      console.error("Welcome email failed:", emailError)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
