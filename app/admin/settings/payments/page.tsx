"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MOMO_PROVIDERS } from "@/lib/utils/constants"
import { SettingsNav } from "@/components/admin/settings-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Save } from "lucide-react"
import { toast } from "sonner"

const FIELDS = [
  { key: "delivery_fee", label: "Standard Delivery Fee (RWF)" },
  { key: "free_shipping_threshold", label: "Free Shipping Threshold (RWF)" },
] as const

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [original, setOriginal] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from("store_settings").select("key, value")
      const map: Record<string, string> = {}
      data?.forEach((row: { key: string; value: string }) => {
        map[row.key] = String(row.value)
      })
      setSettings(map)
      setOriginal(map)
      setLoading(false)
    }
    load()
  }, [])

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
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Customers can pay via the following MTN MoMo providers at checkout.
            Configure API credentials in your environment variables.
          </p>
          <div className="flex flex-wrap gap-2">
            {MOMO_PROVIDERS.map((p) => (
              <Badge
                key={p.value}
                variant="secondary"
                style={{ color: p.color }}
              >
                {p.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
