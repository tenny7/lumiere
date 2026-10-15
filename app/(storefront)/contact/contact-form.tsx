"use client"

import { useState } from "react"
import { toast } from "sonner"

export function ContactForm() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to send message")
      } else {
        setSent(true)
        setName("")
        setEmail("")
        setMessage("")
        toast.success("Message sent — we'll be in touch soon.")
      }
    } catch {
      toast.error("Something went wrong. Please try again.")
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#8a8478] mb-2">
            Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border border-white/[0.08] px-4 py-3 text-sm text-[#f5f0e8] focus:border-amber-500/50 focus:outline-none transition-colors"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#8a8478] mb-2">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-transparent border border-white/[0.08] px-4 py-3 text-sm text-[#f5f0e8] focus:border-amber-500/50 focus:outline-none transition-colors"
            placeholder="your@email.com"
          />
        </div>
      </div>
      <div>
        <label className="block text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#8a8478] mb-2">
          Message
        </label>
        <textarea
          rows={5}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-transparent border border-white/[0.08] px-4 py-3 text-sm text-[#f5f0e8] focus:border-amber-500/50 focus:outline-none transition-colors resize-none"
          placeholder="How can we help?"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-8 py-3 bg-amber-500 text-black text-[0.7rem] font-medium tracking-[0.15em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
      >
        {loading ? "Sending..." : sent ? "Message Sent" : "Send Message"}
      </button>
    </form>
  )
}
