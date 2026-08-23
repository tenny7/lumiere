"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

/**
 * Admin moderation actions for a single review. Admins have full RLS access
 * (is_admin()), so we update/delete via the client directly.
 */
export function ReviewActions({
  id,
  isApproved,
}: {
  id: string
  isApproved: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function setApproved(value: boolean) {
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("reviews")
      .update({ is_approved: value })
      .eq("id", id)
    if (error) {
      toast.error("Failed to update review")
    } else {
      toast.success(value ? "Review published" : "Review hidden")
      window.dispatchEvent(new Event("reviews:updated"))
      router.refresh()
    }
    setBusy(false)
  }

  async function remove() {
    if (!confirm("Delete this review permanently?")) return
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.from("reviews").delete().eq("id", id)
    if (error) {
      toast.error("Failed to delete review")
    } else {
      toast.success("Review deleted")
      window.dispatchEvent(new Event("reviews:updated"))
      router.refresh()
    }
    setBusy(false)
  }

  return (
    <div className="flex shrink-0 gap-2">
      {isApproved ? (
        <Button size="sm" variant="outline" onClick={() => setApproved(false)} disabled={busy}>
          Hide
        </Button>
      ) : (
        <Button size="sm" onClick={() => setApproved(true)} disabled={busy}>
          Approve
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        className="text-red-500 hover:text-red-500"
        onClick={remove}
        disabled={busy}
      >
        Delete
      </Button>
    </div>
  )
}
