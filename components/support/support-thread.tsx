"use client"

import { useEffect, useRef, useState } from "react"
import { formatDateTime } from "@/lib/utils/format"
import { notifyMessagesUpdated } from "@/hooks/use-unread-messages"

export type SupportMessage = {
  id: string
  sender_role: "admin" | "customer"
  body: string
  read_at: string | null
  created_at: string
}

/**
 * Two-way per-order support thread, shared by the admin order page (role="admin")
 * and the customer order page (role="customer"). Own messages align right.
 * Marks the other party's messages read on mount and polls for new ones.
 */
export function SupportThread({
  orderId,
  role,
  initialMessages,
}: {
  orderId: string
  role: "admin" | "customer"
  initialMessages: SupportMessage[]
}) {
  const isAdminSurface = role === "admin"
  const [messages, setMessages] = useState<SupportMessage[]>(initialMessages)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  async function refresh() {
    try {
      const res = await fetch(`/api/support/messages?orderId=${orderId}`)
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data.messages)) setMessages(data.messages)
    } catch {
      /* ignore transient errors */
    }
  }

  // Mark the other party's messages read, then keep the thread fresh.
  useEffect(() => {
    fetch("/api/support/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then(() => notifyMessagesUpdated())
      .catch(() => {})
    const t = setInterval(refresh, 20000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" })
  }, [messages.length])

  async function send() {
    const body = input.trim()
    if (!body || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, body }),
      })
      const data = await res.json()
      if (res.ok && data.message) {
        setMessages((m) => [...m, data.message])
        setInput("")
      }
    } finally {
      setSending(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // Surface-specific styling (admin uses design tokens; storefront uses the dark palette).
  const shell = isAdminSurface
    ? "rounded-lg border bg-card"
    : "border border-white/[0.06] bg-[#111010]"
  const listBg = isAdminSurface ? "" : ""
  const emptyText = isAdminSurface ? "text-muted-foreground" : "text-[#8a8478]"
  const ownBubble = isAdminSurface
    ? "bg-amber-500 text-black"
    : "bg-amber-500 text-black"
  const otherBubble = isAdminSurface
    ? "bg-muted text-foreground"
    : "bg-[#1f1e1c] text-[#f5f0e8]"
  const meta = isAdminSurface ? "text-muted-foreground" : "text-[#8a8478]"
  const inputCls = isAdminSurface
    ? "flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500"
    : "flex-1 resize-none bg-[#1a1918] border border-[#242320] px-3 py-2 text-sm text-[#f5f0e8] outline-none focus:border-amber-500"
  const btnCls = isAdminSurface
    ? "shrink-0 rounded-md bg-amber-500 px-4 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50"
    : "shrink-0 bg-amber-500 px-4 text-[0.72rem] font-medium uppercase tracking-[0.15em] text-black hover:bg-amber-400 disabled:opacity-50"

  return (
    <div className={shell}>
      <div className={`max-h-80 overflow-y-auto p-4 space-y-3 ${listBg}`}>
        {messages.length === 0 ? (
          <p className={`text-sm ${emptyText} py-6 text-center`}>
            {isAdminSurface
              ? "No messages yet. Send the customer an update below."
              : "No messages yet."}
          </p>
        ) : (
          messages.map((m) => {
            const own = m.sender_role === role
            return (
              <div
                key={m.id}
                className={`flex flex-col ${own ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm ${
                    own ? ownBubble : otherBubble
                  }`}
                >
                  {m.body}
                </div>
                <span className={`mt-1 text-[0.6rem] ${meta}`}>
                  {m.sender_role === "admin" ? "Ajabu Lighting" : "Customer"} ·{" "}
                  {formatDateTime(m.created_at)}
                </span>
              </div>
            )
          })
        )}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t border-white/[0.06] p-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder={
            isAdminSurface ? "Message the customer…" : "Message the store…"
          }
          className={inputCls}
        />
        <button
          onClick={send}
          disabled={sending || !input.trim()}
          className={btnCls}
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  )
}
