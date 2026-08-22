"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Number of unread support messages from the store for the signed-in customer
 * (admin messages on their orders that they haven't read yet). 0 for guests.
 * RLS scopes the query to the user's own orders. Components that read/receive
 * messages should dispatch `messages:updated` to keep the badge in sync.
 */
export function useUnreadMessages() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true

    async function refresh() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        if (active) setCount(0)
        return
      }
      const { count: c } = await supabase
        .from("support_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_role", "admin")
        .is("read_at", null)
      if (active) setCount(c ?? 0)
    }

    refresh()
    window.addEventListener("messages:updated", refresh)
    return () => {
      active = false
      window.removeEventListener("messages:updated", refresh)
    }
  }, [])

  return count
}

/** Notify message-aware components (e.g. the header badge) that messages changed. */
export function notifyMessagesUpdated() {
  window.dispatchEvent(new Event("messages:updated"))
}
