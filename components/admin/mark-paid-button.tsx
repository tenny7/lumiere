"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { notifyOrdersUpdated } from "@/hooks/use-orders-needing-attention"

export function MarkPaidButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function markPaid() {
    if (
      !confirm(
        "Mark this order as paid? This confirms the order and reduces stock — use it when payment was received outside the app.",
      )
    )
      return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/mark-paid`, {
        method: "POST",
      })
      if (res.ok) {
        toast.success("Order marked as paid")
        notifyOrdersUpdated()
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Failed to mark as paid")
      }
    } catch {
      toast.error("Failed to mark as paid")
    }
    setLoading(false)
  }

  return (
    <Button
      size="sm"
      variant="outline"
      className="w-full"
      disabled={loading}
      onClick={markPaid}
    >
      <CheckCircle2 className="w-4 h-4 mr-2" />
      {loading ? "Marking…" : "Mark as paid"}
    </Button>
  )
}
