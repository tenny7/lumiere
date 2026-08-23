"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Number of reviews awaiting approval — for the admin sidebar badge. Relies on
 * is_admin() RLS to see unapproved reviews. Non-admins get 0.
 */
export function usePendingReviews() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true

    async function refresh() {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        if (active) setCount(0)
        return
      }
      const { count: c } = await supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("is_approved", false)
      if (active) setCount(c ?? 0)
    }

    refresh()
    window.addEventListener("reviews:updated", refresh)
    return () => {
      active = false
      window.removeEventListener("reviews:updated", refresh)
    }
  }, [])

  return count
}
