"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Ban, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

/**
 * Admin control to suspend / restore a customer's ability to send support
 * messages. Rendered on the admin support thread page.
 */
export function SupportBlockToggle({
  userId,
  initialBlocked,
  customerName,
}: {
  userId: string
  initialBlocked: boolean
  customerName?: string | null
}) {
  const router = useRouter()
  const [blocked, setBlocked] = useState(initialBlocked)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    const next = !blocked
    const name = customerName || "this customer"
    const ok = window.confirm(
      next
        ? `Block ${name} from sending support messages? They'll still see their threads but can't send new messages.`
        : `Unblock ${name} and allow them to message support again?`,
    )
    if (!ok) return

    setLoading(true)
    try {
      const res = await fetch("/api/admin/support/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, blocked: next }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Couldn't update messaging access.")
        return
      }
      setBlocked(next)
      toast.success(next ? "Messaging blocked" : "Messaging unblocked")
      router.refresh()
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={blocked ? "outline" : "destructive"}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className={blocked ? "text-emerald-500 hover:text-emerald-400" : ""}
    >
      {blocked ? (
        <>
          <ShieldCheck className="w-4 h-4 mr-2" />
          Unblock messaging
        </>
      ) : (
        <>
          <Ban className="w-4 h-4 mr-2" />
          Block messaging
        </>
      )}
    </Button>
  )
}
