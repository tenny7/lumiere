import "server-only"
import { cache } from "react"
import { createAdminClient } from "@/lib/supabase/admin"
import { formatCurrency } from "@/lib/utils/format"
import {
  contentDefaults,
  contentSettingKey,
  type ContentMap,
  type SectionKey,
} from "@/lib/content/sections"
import { fillTokens, normalizeContent } from "@/lib/content/normalize"

type Row = { key: string; value: unknown }

const TOKEN_SETTING_KEYS = [
  "store_name",
  "store_email",
  "store_phone",
  "store_address",
  "store_currency",
  "free_shipping_threshold",
  "delivery_fee",
]

// store_address is plain text, or an object on older rows.
function formatAddress(v: unknown): string {
  if (typeof v === "string") return v
  if (v && typeof v === "object") {
    const a = v as Record<string, unknown>
    return ["line_1", "line_2", "city", "region", "country"]
      .map((k) => (typeof a[k] === "string" ? (a[k] as string).trim() : ""))
      .filter(Boolean)
      .join(", ")
  }
  return ""
}

/** Values for {placeholders}, from Admin → Settings. */
export const getContentTokens = cache(async (): Promise<Record<string, string>> => {
  let rows: Row[] = []
  try {
    const { data } = await createAdminClient()
      .from("store_settings")
      .select("key, value")
      .in("key", TOKEN_SETTING_KEYS)
    rows = (data ?? []) as Row[]
  } catch {
    // Fall through to the fallbacks below.
  }
  const get = (k: string) => rows.find((r) => r.key === k)?.value
  const str = (k: string, fallback: string) => {
    const v = get(k)
    return typeof v === "string" && v.trim() ? v.trim() : fallback
  }
  const currency = str("store_currency", "RWF").toUpperCase()
  const money = (k: string) => {
    const n = Number(get(k))
    return Number.isFinite(n) ? formatCurrency(n, currency) : ""
  }
  return {
    store_name: str("store_name", "Ajabu Lighting"),
    store_email: str("store_email", "info@ajabulighting.com"),
    store_phone: str("store_phone", ""),
    store_address: formatAddress(get("store_address")),
    free_delivery_threshold: money("free_shipping_threshold"),
    delivery_fee: money("delivery_fee"),
  }
})

const getStoredContent = cache(async (): Promise<Row[] | null> => {
  try {
    const { data, error } = await createAdminClient()
      .from("store_settings")
      .select("key, value")
      .like("key", "content.%")
    return error ? null : ((data ?? []) as Row[])
  } catch {
    return null
  }
})

/**
 * A section's content for the storefront, with placeholders filled.
 * Never throws: on any read error the default text is shown.
 */
export async function getContent<K extends SectionKey>(key: K): Promise<ContentMap[K]> {
  const [rows, tokens] = await Promise.all([getStoredContent(), getContentTokens()])
  const stored = rows?.find((r) => r.key === contentSettingKey(key))?.value
  const data = stored === undefined ? contentDefaults(key) : normalizeContent(key, stored)
  return fillTokens(data, tokens)
}

/**
 * A section for the admin editor: saved text as typed (placeholders not
 * filled), the original text, when it was last saved, and the current
 * placeholder values.
 */
export async function getEditorContent<K extends SectionKey>(key: K) {
  let stored: unknown
  let updatedAt: string | null = null
  try {
    const { data } = await createAdminClient()
      .from("store_settings")
      .select("value, updated_at")
      .eq("key", contentSettingKey(key))
      .maybeSingle()
    stored = data?.value
    updatedAt = data?.updated_at ?? null
  } catch {
    // Show the original text.
  }
  return {
    initial: stored === undefined ? contentDefaults(key) : normalizeContent(key, stored),
    defaults: contentDefaults(key),
    updatedAt,
    tokens: await getContentTokens(),
  }
}

/** When each section was last saved (sections never edited are absent). */
export async function getContentUpdatedAt(): Promise<Record<string, string>> {
  try {
    const { data } = await createAdminClient()
      .from("store_settings")
      .select("key, updated_at")
      .like("key", "content.%")
    return Object.fromEntries(
      (data ?? []).map((r) => [String(r.key).replace(/^content\./, ""), r.updated_at as string]),
    )
  } catch {
    return {}
  }
}
