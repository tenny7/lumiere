// Admin → Products: search, filters and sorting. Pure functions shared by the
// page (reading the URL) and the table (filtering in the browser). The whole
// catalogue is loaded once and filtered client-side, which is instant at
// this size; the URL keeps the current view so Back and shared links work.

export type ProductRow = {
  id: string
  name: string
  sku: string | null
  categoryId: string | null
  categoryName: string | null
  basePrice: number
  salePrice: number | null
  /** What a customer pays: the sale price when set, else the base price. */
  price: number
  currency: string
  stock: number
  lowStockThreshold: number
  isActive: boolean
  isFeatured: boolean
  createdAt: string
  updatedAt: string
  imageUrl: string | null
}

export const SORTS = [
  { value: "newest", label: "Newest added" },
  { value: "oldest", label: "Oldest added" },
  { value: "updated", label: "Recently updated" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "name_desc", label: "Name Z–A" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "stock_asc", label: "Stock: low to high" },
  { value: "stock_desc", label: "Stock: high to low" },
] as const
export type SortValue = (typeof SORTS)[number]["value"]

export const STATUSES = [
  { value: "", label: "Any status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "featured", label: "Featured" },
] as const

export const STOCK_LEVELS = [
  { value: "", label: "Any stock" },
  { value: "in", label: "In stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
] as const

export type ProductFilters = {
  q: string
  sort: SortValue
  /** A category id, "none" for uncategorised, or "" for all. */
  category: string
  status: "" | "active" | "draft" | "featured"
  stock: "" | "in" | "low" | "out"
  /** Price range on what the customer pays; "" = no limit. */
  min: string
  max: string
}

export const DEFAULT_FILTERS: ProductFilters = {
  q: "",
  sort: "newest",
  category: "",
  status: "",
  stock: "",
  min: "",
  max: "",
}

const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback

const amount = (v: unknown) =>
  typeof v === "string" && /^\d{1,12}$/.test(v.trim()) ? v.trim() : ""

/** Filters from URL search params; anything unknown falls back to the default. */
export function parseFilters(params: Record<string, string | string[] | undefined>): ProductFilters {
  const one = (k: string) => {
    const v = params[k]
    return Array.isArray(v) ? v[0] : v
  }
  const category = one("category")
  return {
    q: (one("q") ?? "").slice(0, 100),
    sort: pick(one("sort"), SORTS.map((s) => s.value), "newest"),
    category:
      typeof category === "string" && /^(none|[0-9a-f-]{36})$/i.test(category) ? category : "",
    status: pick(one("status"), ["", "active", "draft", "featured"] as const, ""),
    stock: pick(one("stock"), ["", "in", "low", "out"] as const, ""),
    min: amount(one("min")),
    max: amount(one("max")),
  }
}

/** URL query for a set of filters (defaults left out). */
export function filtersToQuery(f: ProductFilters): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(f) as [keyof ProductFilters, string][]) {
    const value = k === "q" ? v.trim() : v
    if (value !== "" && value !== DEFAULT_FILTERS[k]) params.set(k, value)
  }
  const s = params.toString()
  return s ? `?${s}` : ""
}

export function stockLevel(p: Pick<ProductRow, "stock" | "lowStockThreshold">): "in" | "low" | "out" {
  if (p.stock <= 0) return "out"
  if (p.stock <= p.lowStockThreshold) return "low"
  return "in"
}

export const hasActiveFilters = (f: ProductFilters) =>
  f.q.trim() !== "" || f.category !== "" || f.status !== "" || f.stock !== "" || f.min !== "" || f.max !== ""

const byName = (a: ProductRow, b: ProductRow) =>
  a.name.localeCompare(b.name, "en", { sensitivity: "base", numeric: true })
const time = (iso: string) => new Date(iso).getTime()

/** The rows that match, in the chosen order (ties broken by name). */
export function applyFilters(rows: ProductRow[], f: ProductFilters): ProductRow[] {
  const q = f.q.trim().toLowerCase()
  const min = f.min === "" ? null : Number(f.min)
  const max = f.max === "" ? null : Number(f.max)

  const out = rows.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q) && !(p.sku ?? "").toLowerCase().includes(q)) return false
    if (f.category === "none" ? p.categoryId !== null : f.category && p.categoryId !== f.category) return false
    if (f.status === "active" && !p.isActive) return false
    if (f.status === "draft" && p.isActive) return false
    if (f.status === "featured" && !p.isFeatured) return false
    if (f.stock && stockLevel(p) !== f.stock) return false
    if (min !== null && p.price < min) return false
    if (max !== null && p.price > max) return false
    return true
  })

  const compare: Record<SortValue, (a: ProductRow, b: ProductRow) => number> = {
    newest: (a, b) => time(b.createdAt) - time(a.createdAt),
    oldest: (a, b) => time(a.createdAt) - time(b.createdAt),
    updated: (a, b) => time(b.updatedAt) - time(a.updatedAt),
    name_asc: byName,
    name_desc: (a, b) => byName(b, a),
    price_asc: (a, b) => a.price - b.price,
    price_desc: (a, b) => b.price - a.price,
    stock_asc: (a, b) => a.stock - b.stock,
    stock_desc: (a, b) => b.stock - a.stock,
  }
  return out.sort((a, b) => compare[f.sort](a, b) || byName(a, b))
}
