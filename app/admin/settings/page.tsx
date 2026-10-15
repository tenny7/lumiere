"use client"

import { useEffect, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SettingsNav } from "@/components/admin/settings-nav"
import { Save } from "lucide-react"
import {
  facebookLink,
  instagramLink,
  whatsappLink,
  type SocialLink,
} from "@/lib/utils/socials"

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

// Shown in the storefront footer and on the Contact page. Stored as typed;
// lib/utils/socials turns each into a link (the preview below uses the same).
const SOCIAL_FIELDS = [
  {
    key: "social_whatsapp",
    label: "WhatsApp number",
    placeholder: "+250 788 123 456",
    help: "The number customers can message. A Rwandan number works with or without +250.",
    toLink: whatsappLink,
  },
  {
    key: "social_instagram",
    label: "Instagram",
    placeholder: "@ajabulighting",
    help: "Your username, or paste your profile link.",
    toLink: instagramLink,
  },
  {
    key: "social_facebook",
    label: "Facebook",
    placeholder: "ajabulighting",
    help: "Your Page username, or paste your Page link.",
    toLink: facebookLink,
  },
] as const satisfies readonly {
  key: string
  label: string
  placeholder: string
  help: string
  toLink: (raw: string) => SocialLink | null
}[]

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [originalSettings, setOriginalSettings] = useState<
    Record<string, string>
  >({})
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saveError, setSaveError] = useState<string | null>(null)

  // A filled-in handle that can't be turned into a link blocks saving.
  const invalidSocial = SOCIAL_FIELDS.some((f) => {
    const raw = (settings[f.key] ?? "").trim()
    return raw !== "" && !f.toLink(raw)
  })

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
    setSaveError(null)
    const supabase = createClient()

    const upserts = [
      ...SETTING_FIELDS.map((field) => ({
        key: field.key,
        value: settings[field.key] ?? "",
      })),
      ...SOCIAL_FIELDS.map((field) => ({
        key: field.key,
        value: (settings[field.key] ?? "").trim(),
      })),
    ]

    const { error } = await supabase
      .from("store_settings")
      .upsert(upserts, { onConflict: "key" })

    if (error) {
      setSaveError(error.message || "Couldn't save settings")
      return
    }

    setOriginalSettings({ ...settings })
    setSaved(true)
    startTransition(() => {
      setTimeout(() => setSaved(false), 2000)
    })
    // Refresh the storefront so the footer and Contact page show the new
    // values (best-effort: they also refresh on their own within the hour).
    fetch("/api/admin/settings/revalidate", { method: "POST" }).catch(() => {})
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

              <div className="space-y-4 border-t pt-6">
                <div>
                  <h3 className="text-sm font-medium">Social media</h3>
                  <p className="text-xs text-muted-foreground">
                    Shown as icons in the site footer and as buttons on the
                    Contact page. Leave a field empty to hide it.
                  </p>
                </div>
                {SOCIAL_FIELDS.map((field) => {
                  const raw = (settings[field.key] ?? "").trim()
                  const link = raw ? field.toLink(raw) : null
                  return (
                    <div key={field.key} className="space-y-2">
                      <Label htmlFor={field.key}>{field.label}</Label>
                      <Input
                        id={field.key}
                        value={settings[field.key] ?? ""}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }))
                        }
                        placeholder={field.placeholder}
                        aria-invalid={raw !== "" && !link}
                        aria-describedby={`${field.key}-hint`}
                      />
                      <p id={`${field.key}-hint`} className="text-xs">
                        {!raw ? (
                          <span className="text-muted-foreground">
                            {field.help} Not shown on the site.
                          </span>
                        ) : link ? (
                          <span className="text-muted-foreground">
                            Opens{" "}
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-600 underline break-all"
                            >
                              {link.url}
                            </a>{" "}
                            — check it&apos;s yours.
                          </span>
                        ) : (
                          <span className="text-destructive">
                            Can&apos;t read this. {field.help}
                          </span>
                        )}
                      </p>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isPending || invalidSocial}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isPending ? "Saving..." : "Save Settings"}
                </Button>
                {saved && (
                  <span className="text-sm text-green-500">
                    Settings saved successfully
                  </span>
                )}
                {saveError && (
                  <span className="text-sm text-destructive">{saveError}</span>
                )}
                {invalidSocial && (
                  <span className="text-sm text-destructive">
                    Fix the social media field marked in red to save.
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
