"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { PAYMENT_METHODS } from "@/lib/utils/constants"
import {
  DELIVERY_METHODS,
  parseDeliveryMethods,
  type DeliveryMethod,
} from "@/lib/orders/delivery"
import { Textarea } from "@/components/ui/textarea"
import { SettingsNav } from "@/components/admin/settings-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save } from "lucide-react"
import { toast } from "sonner"

const ALL_PROVIDER_VALUES = PAYMENT_METHODS.map((p) => p.value)

function parseProviders(value: unknown): string[] | null {
  if (Array.isArray(value)) return value as string[]
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  return null
}

const FIELDS = [
  { key: "delivery_fee", label: "Standard Delivery Fee (RWF)" },
  { key: "free_shipping_threshold", label: "Free Shipping Threshold (RWF)" },
  {
    key: "store_tax_rate",
    label: "VAT Rate (%) — added on top of the goods total, e.g. 18",
  },
] as const

// Text settings for the manual MoMo transfer method (shown to customers at
// checkout when "MoMo Transfer" is active).
const TEXT_FIELDS = [
  {
    key: "momo_manual_number",
    label: "MoMo Number (for manual transfers)",
    placeholder: "+250 78X XXX XXX",
  },
  {
    key: "momo_manual_name",
    label: "MoMo Account Name",
    placeholder: "Ajabu Lighting",
  },
  {
    key: "momo_ussd_code",
    label: "MoMo USSD code (optional) — type {amount} where the order total goes",
    placeholder: "e.g. *182*1*1*07XXXXXXXX*{amount}#",
  },
] as const

// Shown to customers who collect their order or send their own rider.
const PICKUP_FIELD = { key: "pickup_instructions" } as const

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [original, setOriginal] = useState<Record<string, string>>({})
  const [activeProviders, setActiveProviders] = useState<string[]>(ALL_PROVIDER_VALUES)
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>(["delivery"])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from("store_settings").select("key, value")
      const map: Record<string, string> = {}
      data?.forEach((row: { key: string; value: unknown }) => {
        map[row.key] = String(row.value)
      })
      setSettings(map)
      setOriginal(map)
      const apRow = data?.find((r) => r.key === "active_payment_providers")
      setActiveProviders(parseProviders(apRow?.value) ?? ALL_PROVIDER_VALUES)
      setDeliveryMethods(
        parseDeliveryMethods(data?.find((r) => r.key === "delivery_methods")?.value),
      )
      setLoading(false)
    }
    load()
  }, [])

  async function toggleProvider(value: string) {
    const next = activeProviders.includes(value)
      ? activeProviders.filter((v) => v !== value)
      : [...activeProviders, value]
    if (next.length === 0) {
      toast.error("Keep at least one payment method active")
      return
    }
    setActiveProviders(next)
    const supabase = createClient()
    const { error } = await supabase
      .from("store_settings")
      .upsert(
        { key: "active_payment_providers", value: next },
        { onConflict: "key" },
      )
    if (error) {
      toast.error("Failed to update payment methods")
    } else {
      toast.success("Payment methods updated")
    }
  }

  async function toggleDeliveryMethod(value: DeliveryMethod) {
    const next = deliveryMethods.includes(value)
      ? deliveryMethods.filter((v) => v !== value)
      : DELIVERY_METHODS.map((m) => m.value).filter(
          (v) => v === value || deliveryMethods.includes(v),
        )
    if (next.length === 0) {
      toast.error("Keep at least one delivery option on")
      return
    }
    setDeliveryMethods(next)
    const { error } = await createClient()
      .from("store_settings")
      .upsert({ key: "delivery_methods", value: next }, { onConflict: "key" })
    if (error) {
      toast.error("Failed to update delivery options")
    } else {
      toast.success("Delivery options updated")
    }
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const upserts = [...FIELDS, ...TEXT_FIELDS, PICKUP_FIELD].map((f) => ({
      key: f.key,
      value: settings[f.key] ?? "",
    }))
    const { error } = await supabase
      .from("store_settings")
      .upsert(upserts, { onConflict: "key" })
    if (error) {
      toast.error("Failed to save")
    } else {
      setOriginal({ ...settings })
      toast.success("Payment settings saved")
    }
    setSaving(false)
  }

  const hasChanges = [...FIELDS, ...TEXT_FIELDS, PICKUP_FIELD].some(
    (f) => settings[f.key] !== original[f.key],
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Delivery fees and payment providers
        </p>
      </div>

      <SettingsNav />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Delivery & Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="h-20 bg-muted rounded animate-pulse" />
          ) : (
            <>
              {FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type="number"
                    value={settings[field.key] ?? ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                </div>
              ))}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-3">
                  MoMo Transfer — the number customers send to when they pay by
                  manual Mobile Money transfer. Leave the number blank to hide
                  that method. The USSD code is shown at checkout exactly as
                  typed, with Copy and (on Android) Dial buttons; leave it blank
                  to hide it.
                </p>
                {TEXT_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-2 mb-4">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input
                      id={field.key}
                      type="text"
                      placeholder={field.placeholder}
                      value={settings[field.key] ?? ""}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <Button onClick={handleSave} disabled={!hasChanges || saving}>
                <Save className="w-4 h-4 mr-2" />
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Delivery Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground mb-3">
            How customers can get their order. With more than one on, checkout
            asks them to choose. Collection and own delivery have no delivery
            fee and are paid online first, so Cash on Delivery is hidden for
            them. They are offered only while MoMo Transfer or MTN MoMo is on.
          </p>
          {DELIVERY_METHODS.map((m) => (
            <div
              key={m.value}
              className="flex items-center justify-between gap-4 py-2.5 border-b last:border-0"
            >
              <div>
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.description}</p>
              </div>
              <Switch
                checked={deliveryMethods.includes(m.value)}
                onCheckedChange={() => toggleDeliveryMethod(m.value)}
                aria-label={`Toggle ${m.label}`}
                disabled={loading}
              />
            </div>
          ))}
          <div className="space-y-2 pt-4">
            <Label htmlFor="pickup_instructions">Collection instructions (optional)</Label>
            <Textarea
              id="pickup_instructions"
              rows={3}
              maxLength={500}
              placeholder="e.g. Bring your order number. Riders should call +250 7XX XXX XXX on arrival."
              value={settings.pickup_instructions ?? ""}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, pickup_instructions: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              The shop address, opening hours and map link come from Content →
              Contact &amp; Showroom. Save with the Save Settings button above.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground mb-3">
            Turn payment methods on or off. Only the active ones appear to
            customers at checkout.
          </p>
          {PAYMENT_METHODS.map((p) => (
            <div
              key={p.value}
              className="flex items-center justify-between py-2.5 border-b last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-sm font-medium">{p.label}</span>
              </div>
              <Switch
                checked={activeProviders.includes(p.value)}
                onCheckedChange={() => toggleProvider(p.value)}
                aria-label={`Toggle ${p.label}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
