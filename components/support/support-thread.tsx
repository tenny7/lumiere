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
 * Full-page two-way support chat for one order, shared by the admin
 * (role="admin") and customer (role="customer") chat pages. Loads the latest
 * page, supports "load earlier" pagination, polls for new messages, and marks
 * the other party's messages read on open.
 */
export function SupportThread({
  orderId,
  role,
  initialMessages,
  initialHasMore = false,
}: {
  orderId: string
  role: "admin" | "customer"
  initialMessages: SupportMessage[]
  initialHasMore?: boolean
}) {
  const isAdminSurface = role === "admin"
  const [messages, setMessages] = useState<SupportMessage[]>(initialMessages)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [loadingEarlier, setLoadingEarlier] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  function mergeAppend(incoming: SupportMessage[]) {
    if (incoming.length === 0) return
    setMessages((cur) => {
      const seen = new Set(cur.map((m) => m.id))
      const fresh = incoming.filter((m) => !seen.has(m.id))
      return fresh.length ? [...cur, ...fresh] : cur
    })
  }

  // Poll for new messages after the latest one we have.
  async function pollNew() {
    const last = messages[messages.length - 1]?.created_at
    if (!last) return
    try {
      const res = await fetch(
        `/api/support/messages?orderId=${orderId}&after=${encodeURIComponent(last)}`,
      )
      if (!res.ok) return
      const data = await res.json()
      mergeAppend(data.messages || [])
    } catch {
      /* ignore transient errors */
    }
  }

  async function loadEarlier() {
    const first = messages[0]?.created_at
    if (!first || loadingEarlier) return
    setLoadingEarlier(true)
    try {
      const res = await fetch(
        `/api/support/messages?orderId=${orderId}&before=${encodeURIComponent(first)}`,
      )
      if (res.ok) {
        const data = await res.json()
        const older: SupportMessage[] = data.messages || []
        setMessages((cur) => {
          const seen = new Set(cur.map((m) => m.id))
          return [...older.filter((m) => !seen.has(m.id)), ...cur]
        })
        setHasMore(Boolean(data.hasMore))
      }
    } finally {
      setLoadingEarlier(false)
    }
  }

  // Mark the other party's messages read, then poll.
  useEffect(() => {
    fetch("/api/support/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })
      .then(() => notifyMessagesUpdated())
      .catch(() => {})
    const t = setInterval(pollNew, 15000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, messages.length])

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
        mergeAppend([data.message])
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

  const shell = isAdminSurface
    ? "flex flex-col h-[70vh] rounded-lg border bg-card"
    : "flex flex-col h-[70vh] border border-white/[0.06] bg-[#111010]"
  const muted = isAdminSurface ? "text-muted-foreground" : "text-[#8a8478]"
  const ownBubble = "bg-amber-500 text-black"
  const otherBubble = isAdminSurface
    ? "bg-muted text-foreground"
    : "bg-[#1f1e1c] text-[#f5f0e8]"
  const inputCls = isAdminSurface
    ? "flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-amber-500"
    : "flex-1 resize-none bg-[#1a1918] border border-[#242320] px-3 py-2 text-sm text-[#f5f0e8] outline-none focus:border-amber-500"
  const btnCls = isAdminSurface
    ? "shrink-0 rounded-md bg-amber-500 px-4 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50"
    : "shrink-0 bg-amber-500 px-4 text-[0.72rem] font-medium uppercase tracking-[0.15em] text-black hover:bg-amber-400 disabled:opacity-50"

  return (
    <div className={shell}>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadEarlier}
              disabled={loadingEarlier}
              className={`text-xs ${muted} hover:underline disabled:opacity-50`}
            >
              {loadingEarlier ? "Loading…" : "Load earlier messages"}
            </button>
          </div>
        )}
        {messages.length === 0 ? (
          <p className={`text-sm ${muted} py-6 text-center`}>
            {isAdminSurface
              ? "No messages yet. Send the customer an update below."
              : "No messages yet. Send us a message about this order below."}
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
                <span className={`mt-1 text-[0.6rem] ${muted}`}>
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
