import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { can } from "@/lib/permissions"
import { sendNewsletterEmail } from "@/lib/newsletter"

// Store emails go through Gmail SMTP, which allows roughly 500 messages a
// day. Sends above this cap are refused (a newsletter service is needed then)
// rather than stopping halfway through the list.
const MAX_RECIPIENTS = 250
const CONCURRENCY = 5

export const maxDuration = 60

const schema = z.object({
  subject: z.string().trim().min(1).max(150),
  message: z.string().trim().min(1).max(10_000),
  /** true: send only to the admin's own email, to check how it looks. */
  test: z.boolean().default(false),
})

// POST /api/admin/newsletter/send — Admin → Content → Newsletter.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!profile || !can(profile.role, "content")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Add a subject and a message." }, { status: 400 })
  }
  const { subject, message, test } = parsed.data

  if (test) {
    if (!user.email) {
      return NextResponse.json({ error: "Your account has no email address." }, { status: 400 })
    }
    try {
      // A test has no real subscriber; its unsubscribe link is inert.
      await sendNewsletterEmail({
        to: user.email,
        subscriberId: "test",
        subject: `[Test] ${subject}`,
        title: subject,
        message,
      })
      return NextResponse.json({ sent: 1, failed: 0, test: true, to: user.email })
    } catch (e) {
      console.error("Newsletter test send failed:", e)
      return NextResponse.json({ error: "Couldn't send the test email." }, { status: 502 })
    }
  }

  const { data: subscribers, error } = await createAdminClient()
    .from("newsletter_subscribers")
    .select("id, email")
    .eq("is_subscribed", true)
    .order("created_at")
  if (error) {
    return NextResponse.json({ error: "Couldn't load subscribers." }, { status: 500 })
  }
  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ error: "There are no subscribers yet." }, { status: 400 })
  }
  if (subscribers.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      {
        error: `You have ${subscribers.length} subscribers. Sending through Gmail is limited to ${MAX_RECIPIENTS} at a time; a newsletter service is needed for a list this size.`,
      },
      { status: 400 },
    )
  }

  let sent = 0
  const failed: string[] = []
  for (let i = 0; i < subscribers.length; i += CONCURRENCY) {
    const batch = subscribers.slice(i, i + CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map((s) =>
        sendNewsletterEmail({
          to: s.email,
          subscriberId: s.id,
          subject,
          title: subject,
          message,
        }),
      ),
    )
    results.forEach((r, j) => {
      if (r.status === "fulfilled") sent++
      else {
        failed.push(batch[j].email)
        console.error("Newsletter send failed:", r.reason)
      }
    })
  }

  return NextResponse.json({ sent, failed: failed.length, failedEmails: failed })
}
