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
  trackingNumber: initialTracking = "",
  trackingCarrier: initialCarrier = "",
  trackingUrl: initialUrl = "",
}: {
  orderId: string
  currentStatus: string
  trackingNumber?: string
  trackingCarrier?: string
  trackingUrl?: string
}) {
  const [status, setStatus] = useState(currentStatus)
  const [trackingNumber, setTrackingNumber] = useState(initialTracking)
  const [trackingCarrier, setTrackingCarrier] = useState(initialCarrier)
  const [trackingUrl, setTrackingUrl] = useState(initialUrl)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const options = NEXT_STATUSES[currentStatus] ?? []
  const showTracking = status === "shipped"

  const [saving, setSaving] = useState(false)

  async function handleUpdate() {
    if (status === currentStatus) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          ...(showTracking
            ? { trackingNumber, trackingCarrier, trackingUrl }
            : {}),
        }),
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

      {showTracking && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={trackingCarrier}
            onChange={(e) => setTrackingCarrier(e.target.value)}
            placeholder="Carrier (e.g. DHL, local courier)"
            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm outline-none focus:border-ring"
          />
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Tracking number"
            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm outline-none focus:border-ring"
          />
          <input
            type="url"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
            placeholder="Tracking URL (optional)"
            className="w-full px-3 py-2 bg-background border border-input rounded-lg text-sm outline-none focus:border-ring"
          />
          <p className="text-xs text-muted-foreground">
            Included in the shipping email sent to the customer.
          </p>
        </div>
      )}

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
