"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/** Admin → Content → Newsletter: write and send a newsletter. */
export function NewsletterComposer({ subscriberCount }: { subscriberCount: number }) {
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState<"test" | "send" | null>(null)
  const [result, setResult] = useState<{ tone: "ok" | "error"; text: string } | null>(null)

  const ready = subject.trim() !== "" && message.trim() !== ""

  async function send(test: boolean) {
    if (
      !test &&
      !window.confirm(
        `Send “${subject.trim()}” to ${subscriberCount} subscriber${subscriberCount === 1 ? "" : "s"} now? This can't be undone.`,
      )
    )
      return
    setBusy(test ? "test" : "send")
    setResult(null)
    try {
      const res = await fetch("/api/admin/newsletter/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, test }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setResult({ tone: "error", text: data.error || "Couldn't send. Please try again." })
      } else if (data.test) {
        setResult({ tone: "ok", text: `Test sent to ${data.to}. Check how it looks before sending.` })
      } else {
        setResult({
          tone: data.failed ? "error" : "ok",
          text: data.failed
            ? `Sent to ${data.sent}. ${data.failed} failed: ${data.failedEmails.join(", ")}.`
            : `Sent to ${data.sent} subscriber${data.sent === 1 ? "" : "s"}.`,
        })
        if (!data.failed) {
          setSubject("")
          setMessage("")
        }
      }
    } catch {
      setResult({ tone: "error", text: "Couldn't reach the server. Please try again." })
    }
    setBusy(null)
  }

  return (
    <section className="max-w-3xl space-y-4 rounded-lg border bg-card p-5 sm:p-6">
      <div>
        <h2 className="text-base font-semibold">Send a newsletter</h2>
        <p className="text-sm text-muted-foreground">
          Goes to everyone subscribed ({subscriberCount}), from the store&apos;s
          email, with an unsubscribe link at the bottom. Send yourself a test
          first.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nl-subject">Subject</Label>
        <Input
          id="nl-subject"
          value={subject}
          maxLength={150}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="New arrivals for the festive season"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="nl-message">Message</Label>
        <Textarea
          id="nl-message"
          rows={8}
          value={message}
          maxLength={10_000}
          onChange={(e) => setMessage(e.target.value)}
          aria-describedby="nl-message-help"
        />
        <p id="nl-message-help" className="text-xs text-muted-foreground">
          Plain text. Leave an empty line between paragraphs. A “Visit the
          shop” button is added at the end.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={() => send(true)} disabled={!ready || busy !== null}>
          {busy === "test" ? "Sending test…" : "Send a test to me"}
        </Button>
        <Button onClick={() => send(false)} disabled={!ready || busy !== null || subscriberCount === 0}>
          <Send className="mr-2 h-4 w-4" />
          {busy === "send" ? "Sending…" : `Send to ${subscriberCount}`}
        </Button>
        {result && (
          <span
            role="status"
            className={`text-sm ${result.tone === "ok" ? "text-green-600 dark:text-green-500" : "text-destructive"}`}
          >
            {result.text}
          </span>
        )}
      </div>
    </section>
  )
}
