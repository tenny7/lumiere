"use client"

import { useState } from "react"
import { Mail, Phone, MapPin } from "lucide-react"
import { toast } from "sonner"

export default function ContactPage() {
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
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
          Get In Touch
        </p>
        <h1 className="font-serif text-4xl lg:text-5xl font-light mb-10">
          Contact Us
        </h1>

        <div className="grid gap-6 sm:grid-cols-3 mb-12">
          <div className="border border-white/[0.06] p-6">
            <Mail className="w-5 h-5 text-amber-400 mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-base mb-1">Email</h3>
            <p className="text-sm text-[#8a8478]">support@lumiere.com</p>
          </div>
          <div className="border border-white/[0.06] p-6">
            <Phone className="w-5 h-5 text-amber-400 mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-base mb-1">Phone</h3>
            <p className="text-sm text-[#8a8478]">+250 788 123 456</p>
          </div>
          <div className="border border-white/[0.06] p-6">
            <MapPin className="w-5 h-5 text-amber-400 mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-base mb-1">Showroom</h3>
            <p className="text-sm text-[#8a8478]">Kimihurura, Kigali</p>
          </div>
        </div>

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
      </div>
    </div>
  )
}
