import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils/format"
import {
  ORDER_STATUS_LABELS,
  MOMO_PROVIDERS,
  COD_METHOD_VALUE,
  MOMO_MANUAL_VALUE,
} from "@/lib/utils/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
} from "lucide-react"
import { DonutChart, BarChart, type DonutDatum } from "@/components/admin/charts"

const STATUS_HEX: Record<string, string> = {
  pending: "#eab308",
  confirmed: "#3b82f6",
  processing: "#a855f7",
  shipped: "#06b6d4",
  delivered: "#22c55e",
  cancelled: "#ef4444",
  refunded: "#6b7280",
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

  // Revenue = money actually received in the last 30 days: successful
  // payments by when they were paid, leaving out orders later cancelled or
  // refunded. (Unpaid and abandoned orders never count.)
  const { data: recentPaid } = await supabase
    .from("payments")
    .select("amount, completed_at, order_id, order:orders(status)")
    .eq("status", "successful")
    .gte("completed_at", thirtyDaysAgo.toISOString())
  const paidRows = ((recentPaid ?? []) as unknown as {
    amount: number
    completed_at: string
    order_id: string
    order: { status: string } | null
  }[]).filter(
    (p) => p.order?.status !== "cancelled" && p.order?.status !== "refunded",
  )
  const paidOrderIds = [...new Set(paidRows.map((p) => p.order_id))]

  // Calendar day in Kigali (Central Africa Time, UTC+2, no DST).
  const kigaliDay = (ms: number) =>
    new Date(ms + 2 * 60 * 60 * 1000).toISOString().split("T")[0]

  const revenueByDate: Record<string, number> = {}
  let totalRevenue = 0
  for (const p of paidRows) {
    const date = kigaliDay(new Date(p.completed_at).getTime())
    revenueByDate[date] = (revenueByDate[date] ?? 0) + Number(p.amount)
    totalRevenue += Number(p.amount)
  }

  // Continuous last-14-days series (one entry per day, 0 for days with no sales).
  const daySeries: { label: string; value: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const key = kigaliDay(now.getTime() - i * 24 * 60 * 60 * 1000)
    daySeries.push({ label: key, value: revenueByDate[key] ?? 0 })
  }

  // Top selling products: items from those paid orders.
  const { data: topProducts } = paidOrderIds.length
    ? await supabase
        .from("order_items")
        .select("product_name, quantity, unit_price, total_price")
        .in("order_id", paidOrderIds)
    : { data: [] as { product_name: string; quantity: number; unit_price: number; total_price: number }[] }

  // Aggregate by product name
  const productAgg: Record<
    string,
    { name: string; quantity: number; revenue: number }
  > = {}
  ;(topProducts ?? []).forEach((item) => {
    const existing = productAgg[item.product_name]
    if (existing) {
      existing.quantity += item.quantity
      existing.revenue += item.total_price
    } else {
      productAgg[item.product_name] = {
        name: item.product_name,
        quantity: item.quantity,
        revenue: item.total_price,
      }
    }
  })
  const topSellingProducts = Object.values(productAgg)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)

  // Orders by status
  const { data: allOrders } = await supabase
    .from("orders")
    .select("status")

  const statusCounts: Record<string, number> = {}
  ;(allOrders ?? []).forEach((order) => {
    statusCounts[order.status] = (statusCounts[order.status] ?? 0) + 1
  })
  const totalOrders = allOrders?.length ?? 0

  // Collections by payment method (from our own successful payments).
  const { data: successfulPayments } = await supabase
    .from("payments")
    .select("amount, provider, provider_metadata")
    .eq("status", "successful")

  const momoValues = MOMO_PROVIDERS.map((p) => p.value) as string[]
  const collections = {
    momo: { label: "MTN Mobile Money", total: 0, count: 0, color: "#f59e0b" },
    transfer: { label: "MoMo Transfer", total: 0, count: 0, color: "#38bdf8" },
    cod: { label: "Cash on Delivery", total: 0, count: 0, color: "#22c55e" },
    other: { label: "Other / Manual", total: 0, count: 0, color: "#94a3b8" },
  }
  ;(successfulPayments ?? []).forEach((p) => {
    const amt = Number(p.amount)
    const method = (p.provider_metadata as { method?: string } | null)?.method
    const bucket = momoValues.includes(p.provider)
      ? collections.momo
      : method === MOMO_MANUAL_VALUE
        ? collections.transfer
        : method === COD_METHOD_VALUE
          ? collections.cod
          : collections.other
    bucket.total += amt
    bucket.count += 1
  })
  const collectionRows = [
    collections.momo,
    collections.transfer,
    collections.cod,
    collections.other,
  ]
  const collectionsTotal = collectionRows.reduce((s, r) => s + r.total, 0)

  // New customers this month vs last month
  const { count: customersThisMonth } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", thisMonthStart.toISOString())

  const { count: customersLastMonth } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .gte("created_at", lastMonthStart.toISOString())
    .lte("created_at", lastMonthEnd.toISOString())

  const thisMonthCount = customersThisMonth ?? 0
  const lastMonthCount = customersLastMonth ?? 0
  const customerGrowth =
    lastMonthCount > 0
      ? Math.round(
          ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100
        )
      : thisMonthCount > 0
        ? 100
        : 0

  // Chart data
  const statusDonut: DonutDatum[] = Object.entries(statusCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([status, count]) => ({
      label: ORDER_STATUS_LABELS[status] ?? status,
      value: count,
      color: STATUS_HEX[status] ?? "#94a3b8",
      display: String(count),
    }))
  const paymentsCount = successfulPayments?.length ?? 0
  const collectionsDonut: DonutDatum[] = collectionRows.map((row) => ({
    label: row.label,
    value: row.total,
    color: row.color,
    display: formatCurrency(row.total),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Store performance overview for the last 30 days
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              30-Day Revenue
            </CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {paidOrderIds.length} paid orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              New Customers
            </CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthCount}</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Customer Growth
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customerGrowth >= 0 ? "+" : ""}
              {customerGrowth}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              vs last month ({lastMonthCount})
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart (simple bar visualization) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily Revenue (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart points={daySeries} />
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDonut.length > 0 ? (
              <DonutChart data={statusDonut} centerLabel="ORDERS" />
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No orders yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Collections by Method */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Collections by Method</CardTitle>
          <p className="text-xs text-muted-foreground">
            Recorded from successful payments — total {formatCurrency(collectionsTotal)}
          </p>
        </CardHeader>
        <CardContent>
          {collectionsTotal > 0 ? (
            <DonutChart
              data={collectionsDonut}
              centerValue={String(paymentsCount)}
              centerLabel="PAYMENTS"
            />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No collections yet
            </p>
          )}
        </CardContent>
      </Card>

      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Top Selling Products (paid, last 30 days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topSellingProducts.map((product, i) => (
                  <TableRow key={product.name}>
                    <TableCell className="text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.quantity}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.revenue)}
                    </TableCell>
                  </TableRow>
                ))}
                {topSellingProducts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-12 text-muted-foreground"
                    >
                      No sales data yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
