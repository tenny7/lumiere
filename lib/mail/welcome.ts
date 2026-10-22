import type { User } from "@supabase/supabase-js"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendMail, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/mail/client"
import { renderWelcomeEmail } from "@/lib/emails/render"

/** Send the "Welcome to Ajabu Lighting" email. Best-effort — never throws. */
export async function sendWelcomeEmail(to: string, customerName: string) {
  try {
    await sendMail({
      from: EMAIL_FROM,
      replyTo: EMAIL_REPLY_TO,
      to,
      subject: "Welcome to Ajabu Lighting",
      html: renderWelcomeEmail({
        customerName,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://ajabulighting.com",
      }),
    })
  } catch (emailError) {
    console.error("Welcome email failed:", emailError)
  }
}

/**
 * True for an account that Google sign-in created and that hasn't been
 * welcomed yet. Supabase lists an account's providers oldest first, so a
 * customer who signed up by email and later used Google still starts with
 * "email" and already had their welcome from the signup form.
 */
export function needsGoogleWelcome(user: User): boolean {
  const meta = user.app_metadata
  const firstProvider = meta.providers?.[0] ?? meta.provider
  return firstProvider === "google" && !meta.welcome_email_sent
}

/**
 * Welcome email for a new Google account; the signup form sends its own
 * through /api/welcome. Sends once: the account is flagged in app_metadata
 * first, which only the server can change. Best-effort — never throws.
 */
export async function welcomeNewGoogleUser(user: User) {
  const email = user.email
  if (!email || !needsGoogleWelcome(user)) return

  try {
    const { error } = await createAdminClient().auth.admin.updateUserById(
      user.id,
      { app_metadata: { welcome_email_sent: true } },
    )
    if (error) throw error
  } catch (e) {
    // Unflagged, it would send again on every sign-in; skip it instead.
    console.error("Could not flag welcome email:", e)
    return
  }

  const name = user.user_metadata.full_name || user.user_metadata.name || "there"
  await sendWelcomeEmail(email, name)
}
