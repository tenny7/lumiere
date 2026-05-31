import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const query = (q || "").trim()
  const supabase = await createClient()

  let products: { id: string; name: string; sku: string | null }[] = []
  let orders: {
    id: string
    order_number: string
    total: number
    currency: string
    created_at: string
  }[] = []
  let customers: { id: string; full_name: string; email: string }[] = []

  if (query) {
    const [p, o, c] = await Promise.all([
      supabase
        .from("products")
        .select("id, name, sku")
        .ilike("name", `%${query}%`)
        .limit(10),
      supabase
        .from("orders")
        .select("id, order_number, total, currency, created_at")
        .ilike("order_number", `%${query}%`)
        .limit(10),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10),
    ])
    products = p.data || []
    orders = o.data || []
    customers = c.data || []
  }

  const empty =
    query && products.length === 0 && orders.length === 0 && customers.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Search results
        </h1>
        <p className="text-sm text-muted-foreground">
          {query ? `Showing matches for “${query}”` : "Enter a search term"}
        </p>
      </div>

      {empty && (
        <p className="text-sm text-muted-foreground">No matches found.</p>
      )}

      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {orders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between text-sm hover:bg-muted -mx-2 px-2 py-1.5 rounded"
              >
                <span className="font-mono">{o.order_number}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(o.total, o.currency)} ·{" "}
                  {formatDateTime(o.created_at)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Products</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {products.map((p) => (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}`}
                className="flex items-center justify-between text-sm hover:bg-muted -mx-2 px-2 py-1.5 rounded"
              >
                <span>{p.name}</span>
                <span className="text-muted-foreground font-mono text-xs">
                  {p.sku || "—"}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {customers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {customers.map((c) => (
              <Link
                key={c.id}
                href="/admin/customers"
                className="flex items-center justify-between text-sm hover:bg-muted -mx-2 px-2 py-1.5 rounded"
              >
                <span>{c.full_name}</span>
                <span className="text-muted-foreground">{c.email}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
