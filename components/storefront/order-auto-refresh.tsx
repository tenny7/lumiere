"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Keeps the order tracker live while the page is open: re-fetches the server
 * component every 15s (and on tab refocus) until the order reaches a terminal
 * state. Pairs with `export const dynamic = "force-dynamic"` on the page.
 */
export function OrderAutoRefresh({ status }: { status: string }) {
  const router = useRouter()

  useEffect(() => {
    if (["delivered", "cancelled", "refunded"].includes(status)) return

    const interval = setInterval(() => router.refresh(), 15000)
    const onFocus = () => router.refresh()
    window.addEventListener("focus", onFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", onFocus)
    }
  }, [status, router])

  return null
}
