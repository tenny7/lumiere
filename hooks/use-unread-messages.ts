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
      // Unread messages on the customer's own orders that they did NOT send
      // (i.e. replies from the store). Excluding own sender_id keeps the count
      // correct even if the same person also holds an admin role.
      const { count: c } = await supabase
        .from("support_messages")
        .select("id", { count: "exact", head: true })
        .eq("sender_role", "admin")
        .neq("sender_id", user.id)
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

/**
 * Number of unread customer messages across all orders — for the admin side.
 * Relies on is_admin() RLS to see every thread. Non-admins get 0.
 */
export function useAdminUnreadMessages() {
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
        .eq("sender_role", "customer")
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
