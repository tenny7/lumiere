import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { ORDER_STATUS_LABELS } from "@/lib/utils/constants"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GettingStarted, type OnboardingStep } from "@/components/admin/getting-started"
import {
  ShoppingCart,
  DollarSign,
  Users,
  Package,
  Clock,
  TrendingUp,
  ArrowUpRight,
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

export default async function AdminDashboard() {
  const supabase = await createClient()

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayISO = startOfToday.toISOString()

  const [
    { data: todayOrders },
    { count: pendingCount },
    { count: newCustomers },
    { count: lowStockCount },
    { data: recentOrders },
    { count: productCount },
    { count: featuredCount },
    { data: storePhoneRow },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total, status")
      .gte("created_at", todayISO),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")
      .gte("created_at", todayISO),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .lte("stock_quantity", 5)
      .eq("is_active", true),
    supabase
      .from("orders")
      .select("*, customer:profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("is_featured", true),
    supabase
      .from("store_settings")
      .select("value")
      .eq("key", "store_phone")
      .maybeSingle(),
  ])

  const storePhone =
    typeof storePhoneRow?.value === "string" ? storePhoneRow.value : ""
  const onboardingSteps: OnboardingStep[] = [
    {
      key: "product",
      label: "Add your first product",
      description: "Build your catalogue so customers have something to buy.",
      href: "/admin/products/new",
      cta: "Add product",
      done: (productCount ?? 0) > 0,
    },
    {
      key: "featured",
      label: "Feature a product on the homepage",
      description: "Featured products headline your storefront.",
      href: "/admin/products",
      cta: "Choose products",
      done: (featuredCount ?? 0) > 0,
    },
    {
      key: "details",
      label: "Complete your store details",
      description: "Set your store name, contact, and address.",
      href: "/admin/settings",
      cta: "Open settings",
      done: storePhone.length > 0 && !storePhone.includes("XX"),
    },
  ]

  const revenueToday = (todayOrders || [])
    .filter((o) => o.status !== "cancelled" && o.status !== "refunded")
    .reduce((sum, o) => sum + Number(o.total), 0)
  const ordersToday = todayOrders?.length ?? 0

  const stats = [
    {
      title: "Today's Revenue",
      value: formatCurrency(revenueToday),
      icon: DollarSign,
    },
    {
      title: "Orders Today",
      value: String(ordersToday),
      icon: ShoppingCart,
    },
    {
      title: "New Customers Today",
      value: String(newCustomers ?? 0),
      icon: Users,
    },
    {
      title: "Pending Orders",
      value: String(pendingCount ?? 0),
      icon: Clock,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="dash-rise" style={{ "--i": 0 } as React.CSSProperties}>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Welcome back. Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* First-run onboarding (hides once complete or dismissed) */}
      <GettingStarted
        steps={onboardingSteps}
        className="dash-rise"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card
            key={stat.title}
            className="group dash-rise transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-md"
            style={{ "--i": i + 1 } as React.CSSProperties}
          >
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 transition-transform duration-200 ease-out group-hover:scale-105">
                <stat.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.title}
                </p>
                <p className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card
          className="lg:col-span-2 dash-rise"
          style={{ "--i": 5 } as React.CSSProperties}
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Link
              href="/admin/orders"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all &rarr;
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(recentOrders || []).map((order) => (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between hover:bg-muted/50 -mx-2 px-2 py-1 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Package className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium font-mono">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer?.full_name || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={`text-[0.6rem] ${statusColors[order.status]}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {formatCurrency(order.total, order.currency)}
                      </p>
                      <p className="text-[0.6rem] text-muted-foreground">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
              {(!recentOrders || recentOrders.length === 0) && (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">No orders yet</p>
                    <p className="text-xs text-muted-foreground">
                      Orders appear here as customers check out.
                    </p>
                  </div>
                  <Link
                    href="/"
                    className="text-xs font-medium text-amber-600 hover:text-amber-700"
                  >
                    View your storefront &rarr;
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="dash-rise" style={{ "--i": 6 } as React.CSSProperties}>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Add New Product", href: "/admin/products/new", icon: Package },
              { label: "View Pending Orders", href: "/admin/orders", icon: Clock },
              {
                label: `Low Stock (${lowStockCount ?? 0})`,
                href: "/admin/products",
                icon: Package,
              },
              { label: "View Analytics", href: "/admin/analytics", icon: TrendingUp },
            ].map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-2.5 rounded-md hover:bg-muted transition-colors group"
              >
                <action.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-sm">{action.label}</span>
                <ArrowUpRight className="w-3 h-3 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
