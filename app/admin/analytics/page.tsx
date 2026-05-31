import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { ORDER_STATUS_LABELS } from "@/lib/utils/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  confirmed: "bg-blue-500/10 text-blue-500",
  processing: "bg-purple-500/10 text-purple-500",
  shipped: "bg-cyan-500/10 text-cyan-500",
  delivered: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
  refunded: "bg-gray-500/10 text-gray-500",
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

  const revenueDays = Object.entries(revenueByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14) // Show last 14 days for readability

  const maxRevenue = Math.max(...revenueDays.map(([, v]) => v), 1)

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
            {revenueDays.length > 0 ? (
              <div className="space-y-2">
                {revenueDays.map(([date, amount]) => (
                  <div key={date} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">
                      {formatDate(date)}
                    </span>
                    <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-amber-500/60 rounded-sm"
                        style={{
                          width: `${Math.max((amount / maxRevenue) * 100, 2)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-medium w-20 text-right">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No revenue data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Orders by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(statusCounts).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(statusCounts)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => (
                    <div
                      key={status}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`text-[0.6rem] ${statusColors[status] ?? ""}`}
                        >
                          {ORDER_STATUS_LABELS[status] ?? status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-foreground/20 rounded-full"
                            style={{
                              width: `${totalOrders > 0 ? (count / totalOrders) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No orders yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

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
