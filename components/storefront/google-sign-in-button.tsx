"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * "Continue with Google" for the login and signup pages. Supabase sends the
 * person to Google and back to /auth/callback, which creates the session;
 * /signing-in then moves their guest cart into the account and goes on to
 * `redirect`. A first sign-in creates the account, and the handle_new_user
 * trigger names the profile from their Google account.
 */
export function GoogleSignInButton({ redirect }: { redirect: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Pressing Back on Google's page can restore this page from the
  // back/forward cache with the button still disabled.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setLoading(false)
    }
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [])

  async function signIn() {
    setError("")
    setLoading(true)

    const after = `/signing-in?next=${encodeURIComponent(redirect)}`
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // `via=google` lets the callback word a failed or cancelled sign-in.
        redirectTo: `${window.location.origin}/auth/callback?via=google&next=${encodeURIComponent(after)}`,
      },
    })

    // On success the browser is already on its way to Google.
    if (authError) {
      setError(authError.message || "Could not reach Google. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={signIn}
        disabled={loading}
        className="w-full py-3 flex items-center justify-center gap-3 border border-[#242320] text-[0.72rem] font-light tracking-[0.2em] uppercase hover:border-amber-500/50 transition-colors disabled:opacity-50"
      >
        <GoogleLogo />
        {loading ? "Opening Google..." : "Continue with Google"}
      </button>
      {error && <p className="text-xs text-red-400 text-center mt-2">{error}</p>}
    </div>
  )
}

/** Google's "G" mark in its brand colours. */
function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-4 h-4 shrink-0" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  )
}
