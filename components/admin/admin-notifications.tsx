"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { toast } from "sonner"
import { playChime } from "@/lib/notification-sound"
import { readNotifSettings } from "@/hooks/use-notification-settings"
import { notifyMessagesUpdated } from "@/hooks/use-unread-messages"

/**
 * Mounted in the admin layout. Subscribes to Supabase Realtime for new orders,
 * reviews, and customer support messages, then plays a chime + toast and
 * refreshes the relevant badges. Respects the per-admin sound settings.
 * Requires the tables to be in the `supabase_realtime` publication (00012).
 */
export function AdminNotifications() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    function alert(message: string, href?: string) {
      const s = readNotifSettings()
      if (!s.enabled) return
      playChime(s.volume)
      toast(message, href ? { action: { label: "View", onClick: () => router.push(href) } } : undefined)
    }

    let channel: RealtimeChannel | null = null
    let cancelled = false

    async function start() {
      // Ensure the realtime socket carries the admin's JWT — postgres_changes
      // only delivers rows the subscriber is allowed to SELECT under RLS, so
      // without the token these events are silently dropped.
      try {
        await supabase.realtime.setAuth()
      } catch {
        /* fall through — subscribe anyway */
      }
      if (cancelled) return

      channel = supabase
        .channel("admin-notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders" },
          (payload) => {
            const n = payload.new as { id: string; order_number?: string }
            alert(`New order ${n.order_number ?? ""}`.trim(), `/admin/orders/${n.id}`)
            window.dispatchEvent(new Event("orders:updated"))
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "reviews" },
          () => {
            alert("New review submitted", "/admin/reviews")
            window.dispatchEvent(new Event("reviews:updated"))
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "support_messages" },
          (payload) => {
            const n = payload.new as { sender_role: string; order_id: string }
            if (n.sender_role !== "customer") return
            alert("New support message", `/admin/support/${n.order_id}`)
            notifyMessagesUpdated()
          },
        )
        .subscribe()
    }

    start()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
