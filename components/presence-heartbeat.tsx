"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

// Every open tab is a presence session (migration 00021). It checks in every
// 30s, in the background too, and says goodbye as the page closes, so staff
// see people arrive and leave within seconds. A tab that vanishes without a
// goodbye (crash, phone asleep, no signal) expires after 90s.
const HEARTBEAT_MS = 30_000

function newSessionId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID()
  // Older browsers: an RFC 4122 version 4 id from random bytes.
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("")
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

/**
 * Mounted once in the root layout. For signed-in users, opens a presence
 * session for this tab and keeps it alive; signed-out visitors send nothing.
 * Errors are ignored (presence is never worth breaking a page for).
 */
export function PresenceHeartbeat() {
  useEffect(() => {
    const supabase = createClient()
    const sessionId = newSessionId()
    // Kept from the last heartbeat: the goodbye is sent while the page is
    // closing, when there's no time to ask Supabase for the session.
    let token: string | null = null
    let joined = false
    let stopped = false

    async function beat() {
      if (stopped) return
      const {
        data: { session },
      } = await supabase.auth.getSession()
      token = session?.access_token ?? null
      if (!session) return
      const { error } = await supabase.rpc("touch_presence", {
        p_session: sessionId,
      })
      if (!error) {
        joined = true
      } else {
        // Before migration 00021: the per-user heartbeat from 00017.
        await supabase.rpc("touch_presence").then(
          () => {},
          () => {},
        )
      }
    }

    // A normal request can be cancelled as the page unloads; keepalive lets
    // this one finish.
    function leave() {
      if (!joined || !token) return
      joined = false
      fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/leave_presence`,
        {
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ p_session: sessionId }),
        },
      ).catch(() => {})
    }

    // Closing the tab, reloading, or leaving the site.
    const onPageHide = () => leave()
    // Coming back via the browser's Back button (page restored from cache).
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) beat()
    }
    // Background tabs check in less often; catch up when they're shown, and
    // when the connection comes back.
    const onVisible = () => {
      if (document.visibilityState === "visible") beat()
    }
    const onOnline = () => beat()

    beat()
    const timer = setInterval(beat, HEARTBEAT_MS)
    window.addEventListener("pagehide", onPageHide)
    window.addEventListener("pageshow", onPageShow)
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("online", onOnline)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        leave() // still has the last token
        token = null
      } else if (event === "SIGNED_IN") {
        token = session?.access_token ?? token
        // The callback holds Supabase's auth lock, so a Supabase call made
        // inside it can deadlock; run it just after.
        setTimeout(beat, 0)
      } else if (session) {
        token = session.access_token
      }
    })

    return () => {
      stopped = true
      clearInterval(timer)
      window.removeEventListener("pagehide", onPageHide)
      window.removeEventListener("pageshow", onPageShow)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("online", onOnline)
      subscription.unsubscribe()
      leave()
    }
  }, [])

  return null
}
