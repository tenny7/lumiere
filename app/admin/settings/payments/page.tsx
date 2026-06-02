"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MOMO_PROVIDERS } from "@/lib/utils/constants"
import { SettingsNav } from "@/components/admin/settings-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Save } from "lucide-react"
import { toast } from "sonner"

const ALL_PROVIDER_VALUES = MOMO_PROVIDERS.map((p) => p.value)

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
] as const

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [original, setOriginal] = useState<Record<string, string>>({})
  const [activeProviders, setActiveProviders] = useState<string[]>(ALL_PROVIDER_VALUES)
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

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const upserts = FIELDS.map((f) => ({
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

  const hasChanges = FIELDS.some((f) => settings[f.key] !== original[f.key])

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
          <CardTitle className="text-base">Delivery & Fees</CardTitle>
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
          <CardTitle className="text-base">Mobile Money Providers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground mb-3">
            Turn payment methods on or off. Only the active ones appear to
            customers at checkout.
          </p>
          {MOMO_PROVIDERS.map((p) => (
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
