"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { toast } from "sonner"
import { playChime } from "@/lib/notification-sound"
import { readNotifSettings } from "@/hooks/use-notification-settings"
import { notifyMessagesUpdated } from "@/hooks/use-unread-messages"
import { notifyOrdersUpdated } from "@/hooks/use-orders-needing-attention"
import { COD_METHOD_VALUE, MOMO_MANUAL_VALUE } from "@/lib/utils/constants"
import { can, type StaffArea } from "@/lib/permissions"

type PaymentRow = {
  order_id: string
  provider: string
  status: string
  provider_metadata: { method?: string } | null
}

/**
 * Mounted in the admin layout. Subscribes to Supabase Realtime for new orders
 * (via payments), reviews, and customer support messages, then plays a chime +
 * toast and refreshes the relevant badges. Respects the per-admin sound
 * settings. Requires the tables to be in the `supabase_realtime` publication
 * (00012 for reviews/support_messages, 00015 for payments).
 */
export function AdminNotifications({ role }: { role: string | null }) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Always show the pop-up; "Sound alerts" only controls the chime. Each
    // alert is only for staff whose role covers that area.
    function alert(area: StaffArea, message: string, href?: string) {
      if (!can(role, area)) return
      const s = readNotifSettings()
      if (s.enabled) playChime(s.volume)
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
        // New orders are signalled by their payment, not the order row: orders
        // are created at "Continue to Payment", before the customer commits.
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "payments" },
          (payload) => {
            const p = payload.new as PaymentRow
            // A manual payment row means the order was just placed
            // (Cash on Delivery or MoMo transfer). API MoMo rows are created at
            // initiation, so those wait for the success UPDATE below.
            if (p.provider === "manual") {
              const method = p.provider_metadata?.method
              alert(
                "orders",
                method === MOMO_MANUAL_VALUE
                  ? "New order — verify MoMo transfer"
                  : method === COD_METHOD_VALUE
                    ? "New Cash on Delivery order"
                    : "New order placed",
                `/admin/orders/${p.order_id}`,
              )
            }
            notifyOrdersUpdated()
          },
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "payments" },
          (payload) => {
            const p = payload.new as PaymentRow
            // API MoMo payment confirmed → a paid order is in. (Manual payments
            // turn successful when an admin marks them paid — no alert.)
            if (p.status === "successful" && p.provider !== "manual") {
              alert("orders", "New order paid via MoMo", `/admin/orders/${p.order_id}`)
            }
            notifyOrdersUpdated()
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "reviews" },
          () => {
            alert("reviews", "New review submitted", "/admin/reviews")
            window.dispatchEvent(new Event("reviews:updated"))
          },
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "support_messages" },
          (payload) => {
            const n = payload.new as { sender_role: string; order_id: string }
            if (n.sender_role !== "customer") return
            alert("support", "New support message", `/admin/support/${n.order_id}`)
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
  }, [role])

  return null
}
