"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export const ORDERS_UPDATED_EVENT = "orders:updated"

/** Ask the admin sidebar badge to recount (after a status change, etc.). */
export function notifyOrdersUpdated() {
  window.dispatchEvent(new Event(ORDERS_UPDATED_EVENT))
}

// Safety-net refresh so the badge stays fresh even if Realtime is unavailable.
const POLL_MS = 60_000

/**
 * Orders needing admin attention — for the sidebar badge. Counts orders that
 * were actually placed (they have a payment that isn't failed/refunded) and are
 * still `pending` (verify the MoMo transfer / dispatch COD) or `confirmed`
 * (paid, ready to process). Abandoned checkouts have no payment, so they're
 * never counted. Relies on staff RLS; non-staff get 0.
 */
export function useOrdersNeedingAttention() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true

    async function refresh() {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        if (active) setCount(0)
        return
      }
      const { count: c } = await supabase
        .from("orders")
        .select("id, payments!inner(id)", { count: "exact", head: true })
        .in("status", ["pending", "confirmed"])
        .in("payments.status", ["pending", "processing", "successful"])
      if (active) setCount(c ?? 0)
    }

    refresh()
    const t = setInterval(refresh, POLL_MS)
    window.addEventListener(ORDERS_UPDATED_EVENT, refresh)
    return () => {
      active = false
      clearInterval(t)
      window.removeEventListener(ORDERS_UPDATED_EVENT, refresh)
    }
  }, [])

  return count
}
