import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Handles the link in confirmation / magic-link / password-recovery emails.
// Supabase (PKCE flow) sends the user back here with a `?code=` that must be
// exchanged for a session cookie server-side. Without this route the links land
// on a page that never signs the user in.
//   /auth/callback?code=...&next=/some/path
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const rawNext = searchParams.get("next") ?? "/"
  // Prevent open redirect — only allow same-site relative paths.
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Behind Vercel's proxy the request origin is internal; prefer the
      // forwarded host so the redirect goes to the real public domain.
      const forwardedHost = request.headers.get("x-forwarded-host")
      const isLocal = process.env.NODE_ENV === "development"
      if (!isLocal && forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // No code, or the exchange failed (expired / already used / wrong device).
  return NextResponse.redirect(`${origin}/login?error=link_invalid`)
}
