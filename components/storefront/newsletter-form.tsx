"use client"

import { useState } from "react"
import { toast } from "sonner"

export function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to subscribe")
      } else {
        setSubscribed(true)
        setEmail("")
        toast.success("You're subscribed — welcome to Lumière.")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    }
    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row max-w-md mx-auto gap-0 relative"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        className="flex-1 px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478] outline-none focus:border-amber-500 transition-colors"
      />
      <button
        type="submit"
        disabled={loading || subscribed}
        className="px-6 py-3 bg-amber-500 text-black text-[0.7rem] font-medium tracking-[0.15em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
      >
        {loading ? "..." : subscribed ? "Subscribed" : "Subscribe"}
      </button>
    </form>
  )
}
