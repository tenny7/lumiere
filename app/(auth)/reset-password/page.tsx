"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // The recovery link is exchanged for a session by /auth/callback before we
  // land here, so a valid recovery attempt already has a session. If there's
  // none (link expired, opened on another device), send them to start over.
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user)
      setChecking(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.updateUser({ password })
    if (authError) {
      setError(authError.message || "Couldn't update your password.")
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
    // Give them a moment to read the confirmation, then send them home
    // (they're signed in now).
    setTimeout(() => {
      router.push("/")
      router.refresh()
    }, 1500)
  }

  if (checking) {
    return (
      <div className="text-center text-sm text-[#8a8478]">Loading…</div>
    )
  }

  if (!hasSession) {
    return (
      <div className="text-center">
        <h1 className="font-serif text-2xl font-light mb-2">Link expired</h1>
        <p className="text-sm text-[#8a8478] mb-8 leading-relaxed">
          This password reset link is invalid or has expired. Please request a
          new one.
        </p>
        <Link
          href="/forgot-password"
          className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          Request a new reset link
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="text-center">
        <h1 className="font-serif text-2xl font-light mb-2">
          Password updated
        </h1>
        <p className="text-sm text-[#8a8478]">
          You&apos;re all set. Taking you back to the store…
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-2">Set a new password</h1>
      <p className="text-sm text-[#8a8478] mb-8">
        Choose a new password for your account
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
            New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            required
            minLength={6}
            className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Re-enter your password"
            required
            minLength={6}
            className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  )
}
