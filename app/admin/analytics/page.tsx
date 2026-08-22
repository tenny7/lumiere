import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils/format"
import { ORDER_STATUS_LABELS, MOMO_PROVIDERS, COD_METHOD_VALUE } from "@/lib/utils/constants"
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

  // Revenue over last 30 days
  const { data: recentOrders } = await supabase
    .from("orders")
    .select("total, currency, created_at, status")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .not("status", "in", "(cancelled,refunded)")

  // Group revenue by date
  const revenueByDate: Record<string, number> = {}
  let totalRevenue = 0
  ;(recentOrders ?? []).forEach((order) => {
    const date = new Date(order.created_at).toISOString().split("T")[0]
    revenueByDate[date] = (revenueByDate[date] ?? 0) + order.total
    totalRevenue += order.total
  })

  // Continuous last-14-days series (one entry per day, 0 for days with no sales).
  const daySeries: { label: string; value: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().split("T")[0]
    daySeries.push({ label: key, value: revenueByDate[key] ?? 0 })
  }

  // Top selling products
  const { data: topProducts } = await supabase
    .from("order_items")
    .select("product_name, quantity, unit_price, total_price")
    .order("quantity", { ascending: false })
    .limit(50)

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
    momo: { label: "MTN Mobile Money", total: 0, count: 0 },
    cod: { label: "Cash on Delivery", total: 0, count: 0 },
    other: { label: "Other / Manual", total: 0, count: 0 },
  }
  ;(successfulPayments ?? []).forEach((p) => {
    const amt = Number(p.amount)
    const method = (p.provider_metadata as { method?: string } | null)?.method
    if (momoValues.includes(p.provider)) {
      collections.momo.total += amt
      collections.momo.count += 1
    } else if (method === COD_METHOD_VALUE) {
      collections.cod.total += amt
      collections.cod.count += 1
    } else {
      collections.other.total += amt
      collections.other.count += 1
    }
  })
  const collectionsTotal =
    collections.momo.total + collections.cod.total + collections.other.total
  const collectionRows = [collections.momo, collections.cod, collections.other]

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
  const collectionsDonut: DonutDatum[] = collectionRows.map((row, i) => ({
    label: row.label,
    value: row.total,
    color: ["#f59e0b", "#22c55e", "#94a3b8"][i],
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
              {recentOrders?.length ?? 0} orders
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
          <CardTitle className="text-base">Top Selling Products</CardTitle>
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
