"use client"

import { useState } from "react"

export function UnsubscribeButton({ id }: { id: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [error, setError] = useState("")

  async function unsubscribe() {
    setState("loading")
    try {
      const res = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        setState("error")
      } else {
        setState("done")
      }
    } catch {
      setError("Something went wrong. Please try again.")
      setState("error")
    }
  }

  if (state === "done") {
    return (
      <p role="status" className="text-sm text-[#f5f0e8]">
        Done — you won&apos;t receive our newsletter any more.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={unsubscribe}
        disabled={state === "loading"}
        className="px-8 py-3 bg-amber-500 text-black text-[0.7rem] font-medium tracking-[0.15em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
      >
        {state === "loading" ? "Unsubscribing…" : "Unsubscribe"}
      </button>
      {state === "error" && (
        <p role="alert" className="text-sm text-rose-400">
          {error}
        </p>
      )}
    </div>
  )
}
