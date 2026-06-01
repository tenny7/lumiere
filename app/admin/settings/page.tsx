"use client"

import { useEffect, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SettingsNav } from "@/components/admin/settings-nav"
import { Save } from "lucide-react"

const SETTING_FIELDS = [
  { key: "store_name", label: "Store Name", type: "text" },
  { key: "store_email", label: "Store Email", type: "email" },
  { key: "store_phone", label: "Store Phone", type: "tel" },
  { key: "store_address", label: "Store Address", type: "text" },
  { key: "store_currency", label: "Currency (e.g. RWF, USD)", type: "text" },
  {
    key: "free_shipping_threshold",
    label: "Free Shipping Threshold",
    type: "number",
  },
] as const

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [originalSettings, setOriginalSettings] = useState<
    Record<string, string>
  >({})
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from("store_settings").select("key, value")
      const map: Record<string, string> = {}
      data?.forEach((row: { key: string; value: string }) => {
        map[row.key] = row.value
      })
      setSettings(map)
      setOriginalSettings(map)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave() {
    setSaved(false)
    const supabase = createClient()

    const upserts = SETTING_FIELDS.map((field) => ({
      key: field.key,
      value: settings[field.key] ?? "",
    }))

    const { error } = await supabase
      .from("store_settings")
      .upsert(upserts, { onConflict: "key" })

    if (!error) {
      setOriginalSettings({ ...settings })
      setSaved(true)
      startTransition(() => {
        setTimeout(() => setSaved(false), 2000)
      })
    }
  }

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(originalSettings)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your store settings
        </p>
      </div>

      <SettingsNav />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Store Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {SETTING_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-full bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {SETTING_FIELDS.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  <Input
                    id={field.key}
                    type={field.type}
                    value={settings[field.key] ?? ""}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.label}
                  />
                </div>
              ))}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isPending ? "Saving..." : "Save Settings"}
                </Button>
                {saved && (
                  <span className="text-sm text-green-500">
                    Settings saved successfully
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
