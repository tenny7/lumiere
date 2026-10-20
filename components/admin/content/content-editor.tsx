"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, ExternalLink, Plus, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  CONTENT_TOKENS,
  ICON_NAMES,
  getSection,
  type Field,
  type SectionKey,
  type SubField,
} from "@/lib/content/sections"
import { CONTENT_ICONS } from "@/lib/content/icons"

type Json = Record<string, unknown>

/**
 * Admin → Content editor for one section. Renders the section's fields from
 * lib/content/sections.ts and saves through PUT /api/admin/content/<key>,
 * which cleans the data and refreshes the storefront.
 */
export function ContentEditor({
  sectionKey,
  initial,
  defaults,
  updatedAt,
  tokens,
}: {
  sectionKey: SectionKey
  initial: Json
  defaults: Json
  updatedAt: string | null
  /** Current placeholder values, e.g. { store_email: "info@…" }. */
  tokens: Record<string, string>
}) {
  const section = getSection(sectionKey)!
  const [data, setData] = useState<Json>(initial)
  const [saved, setSaved] = useState<Json>(initial)
  const [lastSaved, setLastSaved] = useState<string | null>(updatedAt)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null)

  const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(saved), [data, saved])

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const set = (key: string, value: unknown) => {
    setMessage(null)
    setData((d) => ({ ...d, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/content/${sectionKey}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMessage({ tone: "error", text: body.error || "Couldn't save. Please try again." })
      } else {
        setData(body.data)
        setSaved(body.data)
        setLastSaved(body.updatedAt)
        setMessage({
          tone: "ok",
          text: "Saved. The site shows it the next time a page is opened.",
        })
      }
    } catch {
      setMessage({ tone: "error", text: "Couldn't reach the server. Please try again." })
    }
    setSaving(false)
  }

  function restoreDefaults() {
    if (
      !window.confirm(
        "Put the original text back in this form? Nothing changes on the site until you click Save.",
      )
    )
      return
    setData(structuredClone(defaults))
    setMessage({ tone: "ok", text: "Original text restored in the form. Click Save to publish it." })
  }

  const usesTokens = JSON.stringify(defaults).includes("{") || section.key === "contact"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{section.title}</h1>
          <p className="text-sm text-muted-foreground">{section.description}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {lastSaved
              ? `Last saved ${new Date(lastSaved).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}`
              : "Showing the original text (never edited)."}
          </p>
        </div>
        <Button variant="outline" size="sm" render={<Link href={section.path} target="_blank" rel="noopener noreferrer" />}>
          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
          View on site
        </Button>
      </div>

      {usesTokens && (
        <details className="max-w-3xl rounded-lg border bg-muted/30 p-4 text-sm">
          <summary className="cursor-pointer font-medium">
            Placeholders you can use in any text
          </summary>
          <p className="mt-2 text-muted-foreground">
            Type one of these and the site fills in the current value from
            Settings, so it stays correct when you change a price or contact
            detail.
          </p>
          <ul className="mt-3 space-y-1.5">
            {CONTENT_TOKENS.map((t) => {
              const name = t.token.slice(1, -1)
              return (
                <li key={t.token} className="flex flex-wrap gap-x-2">
                  <code className="rounded bg-background px-1.5 py-0.5 text-xs">{t.token}</code>
                  <span className="text-muted-foreground">
                    {t.label}: <strong className="text-foreground">{tokens[name] || "(not set)"}</strong>
                  </span>
                </li>
              )
            })}
          </ul>
        </details>
      )}

      <div className="max-w-3xl space-y-5 rounded-lg border bg-card p-5 sm:p-6">
        {section.fields.map((field, i) => (
          <FieldInput
            key={field.type === "heading" ? `h-${i}` : field.key}
            field={field}
            value={field.type === "heading" ? undefined : data[field.key]}
            onChange={(v) => field.type !== "heading" && set(field.key, v)}
            idPrefix={sectionKey}
          />
        ))}
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 flex max-w-[calc(48rem+2rem)] flex-wrap items-center gap-3 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <Button onClick={save} disabled={!dirty || saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save"}
        </Button>
        <Button variant="outline" onClick={() => setData(saved)} disabled={!dirty || saving}>
          Discard changes
        </Button>
        <Button variant="ghost" onClick={restoreDefaults} disabled={saving}>
          Restore original text
        </Button>
        {message && (
          <span
            role="status"
            className={`text-sm ${message.tone === "ok" ? "text-green-600 dark:text-green-500" : "text-destructive"}`}
          >
            {message.text}
          </span>
        )}
        {!message && dirty && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
      </div>
    </div>
  )
}

function Help({ id, text }: { id?: string; text?: string }) {
  if (!text) return null
  return (
    <p id={id} className="text-xs text-muted-foreground">
      {text}
    </p>
  )
}

function FieldInput({
  field,
  value,
  onChange,
  idPrefix,
}: {
  field: Field
  value: unknown
  onChange: (v: unknown) => void
  idPrefix: string
}) {
  if (field.type === "heading") {
    return (
      <div className="border-t pt-5 first:border-t-0 first:pt-0">
        <h2 className="text-sm font-semibold">{field.label}</h2>
        <Help text={field.help} />
      </div>
    )
  }

  const id = `${idPrefix}-${field.key}`
  const helpId = field.help ? `${id}-help` : undefined

  switch (field.type) {
    case "text":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            value={String(value ?? "")}
            maxLength={field.max}
            placeholder={field.placeholder}
            aria-describedby={helpId}
            onChange={(e) => onChange(e.target.value)}
          />
          <Help id={helpId} text={field.help} />
        </div>
      )
    case "textarea":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Textarea
            id={id}
            rows={field.rows ?? 3}
            value={String(value ?? "")}
            maxLength={field.max}
            aria-describedby={helpId}
            onChange={(e) => onChange(e.target.value)}
          />
          <Help id={helpId} text={field.help} />
        </div>
      )
    case "lines":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Textarea
            id={id}
            rows={Math.max(3, Math.min(10, (value as string[] | undefined)?.length ?? 3))}
            value={((value as string[] | undefined) ?? []).join("\n")}
            aria-describedby={helpId}
            onChange={(e) => onChange(e.target.value.split("\n"))}
          />
          <Help id={helpId} text={field.help} />
        </div>
      )
    case "url": {
      const url = String(value ?? "")
      const valid = url === "" || /^https?:\/\/\S+$/i.test(url.trim())
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            type="url"
            inputMode="url"
            value={url}
            placeholder={field.placeholder}
            aria-invalid={!valid}
            aria-describedby={helpId}
            onChange={(e) => onChange(e.target.value)}
          />
          {!valid && (
            <p className="text-xs text-destructive">
              Must start with https:// — it won&apos;t be shown otherwise.
            </p>
          )}
          <Help id={helpId} text={field.help} />
        </div>
      )
    }
    case "toggle":
      return (
        <div className="flex items-start gap-3">
          <Switch
            id={id}
            checked={Boolean(value)}
            onCheckedChange={(v) => onChange(Boolean(v))}
            aria-describedby={helpId}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor={id}>{field.label}</Label>
            <Help id={helpId} text={field.help} />
          </div>
        </div>
      )
    case "number":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            type="number"
            min={field.min}
            max={field.max}
            className="w-28"
            value={String(value ?? "")}
            aria-describedby={helpId}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          />
          <Help id={helpId} text={field.help ?? `Between ${field.min} and ${field.max}.`} />
        </div>
      )
    case "items":
      return (
        <ItemsInput
          field={field}
          items={Array.isArray(value) ? (value as Json[]) : []}
          onChange={onChange}
          id={id}
        />
      )
  }
}

function ItemsInput({
  field,
  items,
  onChange,
  id,
}: {
  field: Extract<Field, { type: "items" }>
  items: Json[]
  onChange: (v: unknown) => void
  id: string
}) {
  const blankItem = (): Json =>
    Object.fromEntries(
      field.fields.map((sf) => [sf.key, sf.type === "lines" ? [] : sf.type === "icon" ? ICON_NAMES[0] : ""]),
    )
  const update = (i: number, key: string, v: unknown) =>
    onChange(items.map((it, j) => (j === i ? { ...it, [key]: v } : it)))
  const move = (i: number, by: number) => {
    const next = [...items]
    const [it] = next.splice(i, 1)
    next.splice(i + by, 0, it)
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">{field.label}</h2>
        <Help text={field.help} />
      </div>
      {items.length === 0 && (
        <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          None yet. This part of the page is hidden until you add one.
        </p>
      )}
      <ol className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="rounded-md border bg-background p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {i + 1}. {String(item[field.titleKey] ?? "") || `New ${field.itemName}`}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Move ${field.itemName} ${i + 1} up`}
                disabled={i === 0}
                onClick={() => move(i, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Move ${field.itemName} ${i + 1} down`}
                disabled={i === items.length - 1}
                onClick={() => move(i, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove ${field.itemName} ${i + 1}`}
                onClick={() => {
                  if (window.confirm(`Remove this ${field.itemName}?`)) {
                    onChange(items.filter((_, j) => j !== i))
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="space-y-3">
              {field.fields.map((sf) => (
                <SubFieldInput
                  key={sf.key}
                  field={sf}
                  value={item[sf.key]}
                  id={`${id}-${i}-${sf.key}`}
                  onChange={(v) => update(i, sf.key, v)}
                />
              ))}
            </div>
          </li>
        ))}
      </ol>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={items.length >= field.maxItems}
        onClick={() => onChange([...items, blankItem()])}
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Add {field.itemName}
      </Button>
      {items.length >= field.maxItems && (
        <p className="text-xs text-muted-foreground">Up to {field.maxItems}.</p>
      )}
    </div>
  )
}

function SubFieldInput({
  field,
  value,
  id,
  onChange,
}: {
  field: SubField
  value: unknown
  id: string
  onChange: (v: unknown) => void
}) {
  const helpId = "help" in field && field.help ? `${id}-help` : undefined
  switch (field.type) {
    case "text":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Input
            id={id}
            value={String(value ?? "")}
            maxLength={field.max}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )
    case "textarea":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Textarea
            id={id}
            rows={field.rows ?? 3}
            value={String(value ?? "")}
            maxLength={field.max}
            aria-describedby={helpId}
            onChange={(e) => onChange(e.target.value)}
          />
          <Help id={helpId} text={field.help} />
        </div>
      )
    case "lines":
      return (
        <div className="space-y-1.5">
          <Label htmlFor={id}>{field.label}</Label>
          <Textarea
            id={id}
            rows={Math.max(3, Math.min(10, (value as string[] | undefined)?.length ?? 3))}
            value={((value as string[] | undefined) ?? []).join("\n")}
            aria-describedby={helpId}
            onChange={(e) => onChange(e.target.value.split("\n"))}
          />
          <Help id={helpId} text={field.help} />
        </div>
      )
    case "icon":
      return (
        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium">{field.label}</legend>
          <div role="radiogroup" className="flex flex-wrap gap-1.5">
            {ICON_NAMES.map((name) => {
              const { Icon, label } = CONTENT_ICONS[name]
              const selected = value === name
              return (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={label}
                  title={label}
                  onClick={() => onChange(name)}
                  className={`flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                    selected
                      ? "border-amber-500 bg-amber-500/15 text-amber-600"
                      : "text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              )
            })}
          </div>
        </fieldset>
      )
  }
}
