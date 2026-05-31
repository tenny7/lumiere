"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Returns the total quantity of items in the cart.
 *
 * For guests the count comes from the `lumiere_cart` localStorage entry; for
 * authenticated users it comes from the `cart_items` table. Components that
 * mutate the cart should dispatch a `cart:updated` window event so the badge
 * stays in sync without a full reload.
 */
export function useCartCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true

    async function refresh() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase
          .from("cart_items")
          .select("quantity")
          .eq("profile_id", user.id)
        if (!active) return
        setCount((data || []).reduce((sum, i) => sum + (i.quantity || 0), 0))
      } else {
        try {
          const cart = JSON.parse(localStorage.getItem("lumiere_cart") || "[]")
          if (!active) return
          setCount(
            cart.reduce(
              (sum: number, i: { quantity?: number }) => sum + (i.quantity || 0),
              0,
            ),
          )
        } catch {
          if (active) setCount(0)
        }
      }
    }

    refresh()

    window.addEventListener("cart:updated", refresh)
    window.addEventListener("storage", refresh)
    return () => {
      active = false
      window.removeEventListener("cart:updated", refresh)
      window.removeEventListener("storage", refresh)
    }
  }, [])

  return count
}

/** Notify all cart-aware components that the cart changed. */
export function notifyCartUpdated() {
  window.dispatchEvent(new Event("cart:updated"))
}
