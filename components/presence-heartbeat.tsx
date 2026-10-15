"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

// How often a visible tab reports "I'm here". Online = seen within 2 minutes.
const HEARTBEAT_MS = 60_000

/**
 * Mounted once in the root layout. For signed-in users, records presence on
 * load, every minute while the tab is visible, and when the tab comes back
 * into view. Signed-out visitors and hidden tabs send nothing. Errors are
 * ignored (e.g. before the presence migration is applied).
 */
export function PresenceHeartbeat() {
  useEffect(() => {
    const supabase = createClient()
    let stopped = false

    async function beat() {
      if (stopped || document.visibilityState !== "visible") return
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      await supabase.rpc("touch_presence").then(
        () => {},
        () => {},
      )
    }

    beat()
    const timer = setInterval(beat, HEARTBEAT_MS)
    const onVisible = () => {
      if (document.visibilityState === "visible") beat()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [])

  return null
}
