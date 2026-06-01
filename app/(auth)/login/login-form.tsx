"use client"

import { useState } from "react"
import Link from "next/link"
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
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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
      setError("Authentication failed. Please try again.")
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

  async function handleMagicLink() {
    if (!email) {
      setError("Please enter your email address first")
      return
    }
    setError("")
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}${redirect}` },
    })

    if (authError) {
      setError("Authentication failed. Please try again.")
      setLoading(false)
      return
    }

    setError("")
    setLoading(false)
    alert("Check your email for the magic link!")
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

        <button
          type="button"
          onClick={handleMagicLink}
          disabled={loading}
          className="w-full py-3 border border-[#242320] text-[0.72rem] font-light tracking-[0.2em] uppercase hover:border-amber-500/50 transition-colors disabled:opacity-50"
        >
          Send Magic Link
        </button>
      </form>

      <p className="text-sm text-[#8a8478] text-center mt-8">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-amber-400 hover:text-amber-300 transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  )
}
