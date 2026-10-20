// Turns stored or submitted content into well-formed section data, and fills
// placeholders. Pure functions, used by the storefront (reading), the save
// route (validating) and the admin editor (initial values).
//
// Rules: anything missing or of the wrong type falls back to the default;
// text is capped at the field's max length; lists are capped in size; links
// must be http(s); icons must be one of ICON_NAMES. Saved text is plain
// text: React escapes it when shown and emails escape it explicitly.

import {
  contentDefaults,
  ICON_NAMES,
  type ContentMap,
  type Field,
  type SectionKey,
  type SubField,
  getSection,
} from "@/lib/content/sections"

const DEFAULT_TEXT_MAX = 300
const DEFAULT_TEXTAREA_MAX = 5000
const LINE_MAX = 300
const DEFAULT_LINES_MAX = 40

type Json = Record<string, unknown>

const isObject = (v: unknown): v is Json =>
  typeof v === "object" && v !== null && !Array.isArray(v)

function cleanText(v: unknown, max: number, fallback: string, multiline: boolean) {
  if (typeof v !== "string") return fallback
  const s = multiline
    ? v.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
    : v.replace(/\s+/g, " ").trim()
  return s.slice(0, max)
}

function cleanLines(v: unknown, maxItems: number, fallback: string[]) {
  if (!Array.isArray(v)) return fallback
  return v
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.replace(/\s+/g, " ").trim().slice(0, LINE_MAX))
    .filter(Boolean)
    .slice(0, maxItems)
}

function cleanUrl(v: unknown, fallback: string) {
  if (typeof v !== "string") return fallback
  const s = v.trim()
  if (s === "") return ""
  try {
    const u = new URL(s)
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString().slice(0, 1000) : ""
  } catch {
    return ""
  }
}

function cleanSubField(f: SubField, v: unknown, fallback: unknown): unknown {
  switch (f.type) {
    case "text":
      return cleanText(v, f.max ?? DEFAULT_TEXT_MAX, String(fallback ?? ""), false)
    case "textarea":
      return cleanText(v, f.max ?? DEFAULT_TEXTAREA_MAX, String(fallback ?? ""), true)
    case "lines":
      return cleanLines(v, DEFAULT_LINES_MAX, Array.isArray(fallback) ? (fallback as string[]) : [])
    case "icon":
      return typeof v === "string" && (ICON_NAMES as readonly string[]).includes(v)
        ? v
        : (fallback ?? ICON_NAMES[0])
  }
}

function cleanField(f: Exclude<Field, { type: "heading" }>, v: unknown, fallback: unknown): unknown {
  switch (f.type) {
    case "text":
      return cleanText(v, f.max ?? DEFAULT_TEXT_MAX, String(fallback ?? ""), false)
    case "textarea":
      return cleanText(v, f.max ?? DEFAULT_TEXTAREA_MAX, String(fallback ?? ""), true)
    case "lines":
      return cleanLines(v, f.maxItems ?? DEFAULT_LINES_MAX, (fallback as string[]) ?? [])
    case "url":
      return cleanUrl(v, String(fallback ?? ""))
    case "toggle":
      return typeof v === "boolean" ? v : Boolean(fallback)
    case "number": {
      const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN
      if (!Number.isFinite(n)) return fallback
      return Math.min(f.max, Math.max(f.min, Math.round(n)))
    }
    case "items": {
      if (!Array.isArray(v)) return fallback
      // A new item's blanks fall back to empty values, not to another item's text.
      const blank = (sf: SubField) =>
        sf.type === "lines" ? [] : sf.type === "icon" ? ICON_NAMES[0] : ""
      return v
        .filter(isObject)
        .slice(0, f.maxItems)
        .map((item) => {
          const out: Json = {}
          for (const sf of f.fields) out[sf.key] = cleanSubField(sf, item[sf.key], blank(sf))
          return out
        })
    }
  }
}

/** Well-formed data for a section from whatever is stored or submitted. */
export function normalizeContent<K extends SectionKey>(key: K, raw: unknown): ContentMap[K] {
  const defaults = contentDefaults(key) as Json
  const section = getSection(key)
  if (!section || !isObject(raw)) return defaults as ContentMap[K]
  const out: Json = { ...defaults }
  for (const f of section.fields) {
    if (f.type === "heading") continue
    if (f.key in raw) out[f.key] = cleanField(f, raw[f.key], defaults[f.key])
  }
  return out as ContentMap[K]
}

/** Replace {placeholders} in every string of a value (unknown ones are kept). */
export function fillTokens<T>(value: T, tokens: Record<string, string>): T {
  if (typeof value === "string") {
    return value.replace(/\{([a-z_]+)\}/g, (m, name: string) =>
      name in tokens ? tokens[name] : m,
    ) as T
  }
  if (Array.isArray(value)) return value.map((v) => fillTokens(v, tokens)) as T
  if (isObject(value)) {
    const out: Json = {}
    for (const [k, v] of Object.entries(value)) out[k] = fillTokens(v, tokens)
    return out as T
  }
  return value
}

/** Split text into paragraphs on blank lines. */
export function toParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
}
