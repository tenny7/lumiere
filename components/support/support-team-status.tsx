"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * For customers in the support chat: shows whether the store team is around.
 * Uses support_team_online(), which returns only true/false (never who).
 * Hidden until known, and if the presence migration isn't applied.
 */
export function SupportTeamStatus() {
  const [online, setOnline] = useState<boolean | null>(null)

  useEffect(() => {
    let active = true
    const supabase = createClient()
    async function check() {
      const { data, error } = await supabase.rpc("support_team_online")
      if (active && !error && typeof data === "boolean") setOnline(data)
    }
    check()
    const t = setInterval(check, 60_000)
    return () => {
      active = false
      clearInterval(t)
    }
  }, [])

  if (online === null) return null

  return (
    <span className="inline-flex items-center gap-2 text-xs text-[#8a8478]">
      <span
        aria-hidden
        className={`inline-block h-2 w-2 rounded-full ${
          online
            ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]"
            : "bg-neutral-500"
        }`}
      />
      {online
        ? "Support team online now"
        : "Support team away — we'll reply by email"}
    </span>
  )
}
