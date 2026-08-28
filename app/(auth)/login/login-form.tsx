"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { mergeGuestCart } from "@/lib/utils/cart"
import { notifyCartUpdated } from "@/hooks/use-cart-count"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get("redirect") || "/"
  // Prevent open redirect — only allow relative paths
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(
    searchParams.get("error") === "link_invalid"
      ? "That link is invalid or has expired. Please sign in or request a new one."
      : "",
  )
  const [loading, setLoading] = useState(false)

  // Magic-link modal (email-only, no password) — kept separate so it's clear
  // the password field isn't involved.
  const [magicOpen, setMagicOpen] = useState(false)
  const [magicEmail, setMagicEmail] = useState("")
  const [magicError, setMagicError] = useState("")
  const [magicSent, setMagicSent] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      // Surface the real reason (e.g. "Email not confirmed", "Invalid login
      // credentials") instead of a generic message.
      setError(
        /email not confirmed/i.test(authError.message)
          ? "Please confirm your email first — check your inbox for the confirmation link."
          : authError.message || "Authentication failed. Please try again.",
      )
      setLoading(false)
      return
    }

    if (data.user) {
      await mergeGuestCart(supabase, data.user.id)
      notifyCartUpdated()
    }

    router.push(redirect)
    router.refresh()
  }

  function openMagicLink() {
    setMagicEmail(email) // prefill with whatever they've typed
    setMagicError("")
    setMagicSent(false)
    setMagicOpen(true)
  }

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    const target = magicEmail.trim()
    if (!target) {
      setMagicError("Please enter your email address.")
      return
    }
    setMagicError("")
    setMagicLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: target,
      options: {
        // Magic links come back with a code to exchange — route through the
        // callback so the session is actually created.
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    })

    if (authError) {
      setMagicError(authError.message || "Could not send the link. Please try again.")
      setMagicLoading(false)
      return
    }

    setMagicLoading(false)
    setMagicSent(true)
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-2">Welcome back</h1>
      <p className="text-sm text-[#8a8478] mb-8">
        Sign in to your Ajabu Lighting account
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478]">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <span className="h-px flex-1 bg-[#242320]" />
        <span className="text-[0.6rem] tracking-[0.2em] uppercase text-[#8a8478]">or</span>
        <span className="h-px flex-1 bg-[#242320]" />
      </div>

      <button
        type="button"
        onClick={openMagicLink}
        className="w-full py-3 border border-[#242320] text-[0.72rem] font-light tracking-[0.2em] uppercase hover:border-amber-500/50 transition-colors"
      >
        Email me a sign-in link
      </button>
      <p className="text-center text-xs text-[#8a8478] mt-2">
        No password needed — we&apos;ll send a one-time link to your inbox.
      </p>

      <p className="text-sm text-[#8a8478] text-center mt-8">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-amber-400 hover:text-amber-300 transition-colors"
        >
          Create one
        </Link>
      </p>

      {/* Magic-link modal — asks for email only */}
      {magicOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setMagicOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-[#111110] border border-[#242320] rounded-xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setMagicOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-[#8a8478] hover:text-[#f5f0e8] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {magicSent ? (
              <div className="text-center py-2">
                <h2 className="font-serif text-xl font-light mb-2 text-[#f5f0e8]">
                  Check your email
                </h2>
                <p className="text-sm text-[#8a8478] leading-relaxed mb-6">
                  We sent a one-time sign-in link to{" "}
                  <strong className="text-[#f5f0e8]">{magicEmail}</strong>. Open
                  it to sign in — no password needed.
                </p>
                <button
                  type="button"
                  onClick={() => setMagicOpen(false)}
                  className="w-full py-3 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-serif text-xl font-light mb-2 text-[#f5f0e8]">
                  Sign in with a link
                </h2>
                <p className="text-sm text-[#8a8478] leading-relaxed mb-5">
                  Enter your email and we&apos;ll send you a secure one-time link
                  to sign in. No password required.
                </p>
                <form onSubmit={sendMagicLink} className="space-y-4">
                  {magicError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">
                      {magicError}
                    </div>
                  )}
                  <div>
                    <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                      Email
                    </label>
                    <input
                      type="email"
                      autoFocus
                      value={magicEmail}
                      onChange={(e) => setMagicEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={magicLoading}
                    className="w-full py-3 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
                  >
                    {magicLoading ? "Sending..." : "Send sign-in link"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
