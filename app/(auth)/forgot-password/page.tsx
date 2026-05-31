"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/account/settings` },
    )

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center">
        <h1 className="font-serif text-2xl font-light mb-2">Check your email</h1>
        <p className="text-sm text-[#8a8478] mb-8">
          We sent a password reset link to <strong className="text-[#f5f0e8]">{email}</strong>
        </p>
        <Link
          href="/login"
          className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          &larr; Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-2">Reset password</h1>
      <p className="text-sm text-[#8a8478] mb-8">
        Enter your email and we&apos;ll send you a reset link
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p className="text-sm text-[#8a8478] text-center mt-8">
        <Link
          href="/login"
          className="text-amber-400 hover:text-amber-300 transition-colors"
        >
          &larr; Back to sign in
        </Link>
      </p>
    </div>
  )
}
