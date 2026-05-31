"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Coupon, CouponType } from "@/lib/types"

// Convert an ISO timestamp to a value usable by <input type="date">
function toDateInput(iso: string | null | undefined) {
  if (!iso) return ""
  return new Date(iso).toISOString().slice(0, 10)
}

export function CouponForm({ coupon }: { coupon?: Coupon }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [code, setCode] = useState(coupon?.code || "")
  const [description, setDescription] = useState(coupon?.description || "")
  const [type, setType] = useState<CouponType>(coupon?.type || "percentage")
  const [value, setValue] = useState(coupon?.value?.toString() || "")
  const [minOrder, setMinOrder] = useState(
    coupon?.min_order_amount?.toString() || "",
  )
  const [maxUses, setMaxUses] = useState(coupon?.max_uses?.toString() || "")
  const [startsAt, setStartsAt] = useState(toDateInput(coupon?.starts_at))
  const [expiresAt, setExpiresAt] = useState(toDateInput(coupon?.expires_at))
  const [isActive, setIsActive] = useState(coupon?.is_active ?? true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      code: code.trim().toUpperCase(),
      description: description || null,
      type,
      value: type === "free_shipping" ? 0 : parseFloat(value) || 0,
      min_order_amount: minOrder ? parseFloat(minOrder) : null,
      max_uses: maxUses ? parseInt(maxUses) : null,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      is_active: isActive,
    }

    if (coupon) {
      const { error } = await supabase
        .from("coupons")
        .update(payload)
        .eq("id", coupon.id)
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success("Coupon updated")
    } else {
      const { error } = await supabase.from("coupons").insert(payload)
      if (error) {
        toast.error(
          error.code === "23505" ? "That code already exists" : error.message,
        )
        setLoading(false)
        return
      }
      toast.success("Coupon created")
    }

    router.push("/admin/coupons")
    router.refresh()
  }

  async function handleDelete() {
    if (!coupon) return
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return
    setLoading(true)
    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", coupon.id)
    if (error) {
      toast.error("Failed to delete coupon")
      setLoading(false)
      return
    }
    toast.success("Coupon deleted")
    router.push("/admin/coupons")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Coupon Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="WELCOME10"
                required
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={type}
                onValueChange={(v) => setType((v as CouponType) ?? "percentage")}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  <SelectItem value="free_shipping">Free Shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {type !== "free_shipping" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">
                  {type === "percentage" ? "Percentage (%)" : "Amount (RWF)"}
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="minOrder">Min Order (RWF)</Label>
                <Input
                  id="minOrder"
                  type="number"
                  step="0.01"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="maxUses">Max Uses</Label>
              <Input
                id="maxUses"
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Unlimited"
              />
            </div>
            <div>
              <Label htmlFor="startsAt">Starts</Label>
              <Input
                id="startsAt"
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expiresAt">Expires</Label>
              <Input
                id="expiresAt"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Active</Label>
            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : coupon ? "Update Coupon" : "Create Coupon"}
        </Button>
        {coupon && (
          <Button
            type="button"
            variant="outline"
            className="text-red-500 hover:text-red-500"
            disabled={loading}
            onClick={handleDelete}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}
