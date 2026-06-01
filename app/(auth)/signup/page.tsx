"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, phone },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Send a welcome email (best-effort — never blocks the signup flow).
    fetch("/api/welcome", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name: fullName }),
    }).catch(() => {})

    router.push("/verify-email")
  }

  return (
    <div>
      <h1 className="font-serif text-2xl font-light mb-2">Create an account</h1>
      <p className="text-sm text-[#8a8478] mb-8">
        Join Ajabu Lighting to start shopping for beautiful lights
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
            Full Name
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Kwame Asante"
            required
            className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
          />
        </div>

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
          <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="024 XXX XXXX"
            className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
            Password
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

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="text-sm text-[#8a8478] text-center mt-8">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-amber-400 hover:text-amber-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
