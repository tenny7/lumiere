"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Number of items in the signed-in user's wishlist (0 for guests — the wishlist
 * requires an account). Components that change the wishlist should dispatch a
 * `wishlist:updated` event so the badge stays in sync without a reload.
 */
export function useWishlistCount() {
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
        .from("wishlists")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", user.id)
      if (active) setCount(c ?? 0)
    }

    refresh()
    window.addEventListener("wishlist:updated", refresh)
    return () => {
      active = false
      window.removeEventListener("wishlist:updated", refresh)
    }
  }, [])

  return count
}

/** Notify wishlist-aware components that the wishlist changed. */
export function notifyWishlistUpdated() {
  window.dispatchEvent(new Event("wishlist:updated"))
}
