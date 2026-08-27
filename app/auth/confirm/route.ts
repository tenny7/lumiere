import { type EmailOtpType } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Cross-device confirmation for email links (token-hash flow).
//
// Unlike /auth/callback (PKCE `code`, which needs the verifier stored in the
// browser that started the flow), this verifies a `token_hash` entirely
// server-side, so the email can be opened on any device / browser.
//   /auth/confirm?token_hash=...&type=signup|magiclink|recovery&next=/path
const VALID_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const rawNext = searchParams.get("next") ?? "/"
  // Prevent open redirect — only same-site relative paths.
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/"

  if (tokenHash && type && VALID_TYPES.includes(type)) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })
    if (!error) {
      // Behind Vercel's proxy the request origin is internal; prefer the
      // forwarded host so the redirect targets the real public domain.
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocal = process.env.NODE_ENV === "development"
      if (!isLocal && forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Missing/invalid params, or the token expired / was already used.
  return NextResponse.redirect(`${origin}/login?error=link_invalid`)
}
