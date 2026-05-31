"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ORDER_STATUS_LABELS } from "@/lib/utils/constants"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const NEXT_STATUSES: Record<string, string[]> = {
  confirmed: ["processing", "shipped", "delivered"],
  processing: ["shipped", "delivered"],
  shipped: ["delivered"],
}

export function OrderStatusUpdater({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: string
}) {
  const [status, setStatus] = useState(currentStatus)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const options = NEXT_STATUSES[currentStatus] ?? []

  const [saving, setSaving] = useState(false)

  async function handleUpdate() {
    if (status === currentStatus) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to update status")
      } else {
        toast.success(
          status === "shipped"
            ? "Status updated — customer notified by email"
            : "Status updated",
        )
        startTransition(() => {
          router.refresh()
        })
      }
    } catch {
      toast.error("Failed to update status")
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <Select value={status} onValueChange={(value) => { if (value) setStatus(value) }}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((s) => (
            <SelectItem key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        disabled={status === currentStatus || isPending || saving}
        onClick={handleUpdate}
      >
        {isPending || saving ? "Updating..." : "Update Status"}
      </Button>
    </div>
  )
}
