"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, ArrowUpDown, Plus, Search, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils/format"
import {
  DEFAULT_FILTERS,
  SORTS,
  STATUSES,
  STOCK_LEVELS,
  applyFilters,
  filtersToQuery,
  hasActiveFilters,
  stockLevel,
  type ProductFilters,
  type ProductRow,
  type SortValue,
} from "@/lib/admin/product-filters"

// Native selects: they match the inputs and open the phone's own picker.
const SELECT =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2 text-sm text-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const STOCK_BADGE = {
  in: "bg-green-500/10 text-green-500",
  low: "bg-yellow-500/10 text-yellow-500",
  out: "bg-red-500/10 text-red-500",
} as const

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

/**
 * Admin → Products: the catalogue with search, filters and sorting above the
 * table, and sortable column headers. Filtering happens in the browser
 * (lib/admin/product-filters.ts); the URL keeps the view.
 */
export function ProductsTable({
  rows,
  categories,
  initial,
}: {
  rows: ProductRow[]
  categories: { id: string; name: string }[]
  initial: ProductFilters
}) {
  const [filters, setFilters] = useState<ProductFilters>(initial)
  const set = <K extends keyof ProductFilters>(key: K, value: ProductFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }))

  const shown = useMemo(() => applyFilters(rows, filters), [rows, filters])
  const filtering = hasActiveFilters(filters)

  // Keep the view in the URL (replaceState: typing doesn't fill the history).
  useEffect(() => {
    const t = setTimeout(() => {
      const url = `${window.location.pathname}${filtersToQuery(filters)}`
      if (url !== `${window.location.pathname}${window.location.search}`) {
        window.history.replaceState(null, "", url)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [filters])

  // Column header sorting: first click uses the column's natural order,
  // a second click reverses it.
  const headerSort = (asc: SortValue, desc: SortValue, first: SortValue = asc) => {
    const active = filters.sort === asc || filters.sort === desc
    const next = !active ? first : filters.sort === asc ? desc : asc
    return {
      active,
      ascending: filters.sort === asc,
      onClick: () => set("sort", next),
    }
  }
  const dateIsUpdated = filters.sort === "updated"

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border py-12 text-center">
        <p className="mb-4 text-muted-foreground">No products yet</p>
        <Button size="sm" render={<Link href="/admin/products/new" />}>
          <Plus className="mr-2 h-4 w-4" />
          Add your first product
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search, sort and filters */}
      <div className="space-y-2 rounded-lg border bg-card p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Search by name or SKU"
              aria-label="Search products by name or SKU"
              className="pl-8"
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:w-56">
            <span className="shrink-0 text-muted-foreground">Sort</span>
            <select
              className={SELECT}
              value={filters.sort}
              onChange={(e) => set("sort", e.target.value as SortValue)}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.4fr)_auto]">
          <select
            className={SELECT}
            value={filters.category}
            onChange={(e) => set("category", e.target.value)}
            aria-label="Category"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value="none">No category</option>
          </select>
          <select
            className={SELECT}
            value={filters.status}
            onChange={(e) => set("status", e.target.value as ProductFilters["status"])}
            aria-label="Status"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className={SELECT}
            value={filters.stock}
            onChange={(e) => set("stock", e.target.value as ProductFilters["stock"])}
            aria-label="Stock"
          >
            {STOCK_LEVELS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1.5">
            <Input
              inputMode="numeric"
              value={filters.min}
              onChange={(e) => set("min", e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="Min price"
              aria-label="Minimum price (RWF)"
              className="h-8 min-w-0"
            />
            <span aria-hidden className="text-muted-foreground">
              –
            </span>
            <Input
              inputMode="numeric"
              value={filters.max}
              onChange={(e) => set("max", e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="Max price"
              aria-label="Maximum price (RWF)"
              className="h-8 min-w-0"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="col-span-2 lg:col-span-1"
            disabled={!filtering && filters.sort === DEFAULT_FILTERS.sort}
            onClick={() => setFilters(DEFAULT_FILTERS)}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {filtering
          ? `Showing ${shown.length} of ${rows.length} products`
          : `${rows.length} product${rows.length === 1 ? "" : "s"}`}
        {" · "}
        {SORTS.find((s) => s.value === filters.sort)?.label}
      </p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <SortHead label="Name" {...headerSort("name_asc", "name_desc")} />
              <TableHead>Category</TableHead>
              <TableHead>SKU</TableHead>
              <SortHead label="Price" {...headerSort("price_asc", "price_desc")} />
              <SortHead label="Stock" {...headerSort("stock_asc", "stock_desc")} />
              <TableHead>Status</TableHead>
              {dateIsUpdated ? (
                <SortHead label="Updated" active ascending={false} onClick={() => set("sort", "newest")} />
              ) : (
                <SortHead label="Added" {...headerSort("oldest", "newest", "newest")} />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((p) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="h-10 w-10 overflow-hidden rounded bg-muted">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-amber-500/10 to-transparent" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Link href={`/admin/products/${p.id}`} className="font-medium hover:underline">
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.categoryName || "—"}</TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{p.sku || "—"}</TableCell>
                <TableCell className="tabular-nums">
                  {p.salePrice ? (
                    <div>
                      <span>{formatCurrency(p.salePrice, p.currency)}</span>
                      <span className="ml-1 text-xs text-muted-foreground line-through">
                        {formatCurrency(p.basePrice, p.currency)}
                      </span>
                    </div>
                  ) : (
                    formatCurrency(p.basePrice, p.currency)
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-[0.6rem] ${STOCK_BADGE[stockLevel(p)]}`}>
                    {p.stock} in stock
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant={p.isActive ? "default" : "secondary"}>
                      {p.isActive ? "Active" : "Draft"}
                    </Badge>
                    {p.isFeatured && (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-600">
                        Featured
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                  {formatDate(dateIsUpdated ? p.updatedAt : p.createdAt)}
                </TableCell>
              </TableRow>
            ))}
            {shown.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center">
                  <p className="mb-3 text-muted-foreground">No products match these filters.</p>
                  <Button size="sm" variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                    Reset filters
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function SortHead({
  label,
  active,
  ascending,
  onClick,
}: {
  label: string
  active: boolean
  ascending: boolean
  onClick: () => void
}) {
  const Icon = !active ? ArrowUpDown : ascending ? ArrowUp : ArrowDown
  return (
    <TableHead aria-sort={active ? (ascending ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={onClick}
        className={`-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring ${active ? "text-foreground" : ""}`}
      >
        {label}
        <Icon className={`h-3.5 w-3.5 ${active ? "" : "opacity-40"}`} aria-hidden />
        <span className="sr-only">
          {active ? `, sorted ${ascending ? "ascending" : "descending"}` : ", click to sort"}
        </span>
      </button>
    </TableHead>
  )
}
