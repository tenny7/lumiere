import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ORDER_STATUS_LABELS,
  MOMO_PROVIDERS,
  MOMO_MANUAL_VALUE,
} from "@/lib/utils/constants"
import { can } from "@/lib/permissions"
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
  Wallet,
  Info,
} from "lucide-react"

// Always render on request so "today" reflects the actual current day and the
// figures are never served from a stale cache.
export const dynamic = "force-dynamic"

// Rwanda (Africa/Kigali) is Central Africa Time, UTC+2, year-round with no
// daylight saving. Compute the start of *today in Kigali* as a UTC instant, so
// the day boundary matches the store's local day regardless of the server's
// timezone.
function startOfTodayKigaliISO(): string {
  const KIGALI_OFFSET_MS = 2 * 60 * 60 * 1000
  const nowKigali = new Date(Date.now() + KIGALI_OFFSET_MS)
  const midnightKigaliUTC =
    Date.UTC(
      nowKigali.getUTCFullYear(),
      nowKigali.getUTCMonth(),
      nowKigali.getUTCDate(),
    ) - KIGALI_OFFSET_MS
  return new Date(midnightKigaliUTC).toISOString()
}

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

  // Money figures are for admins only (lib/permissions.ts "finance").
  const {
    data: { user: viewer },
  } = await supabase.auth.getUser()
  const { data: viewerProfile } = viewer
    ? await supabase.from("profiles").select("role").eq("id", viewer.id).single()
    : { data: null }
  const viewerRole = (viewerProfile?.role as string | undefined) ?? null
  const showFinance = can(viewerRole, "finance")

  const todayISO = startOfTodayKigaliISO()

  const [
    { data: todayOrders },
    { count: awaitingPaymentCount },
    { count: newCustomers },
    { data: stockRows },
    { data: recentOrders },
    { count: productCount },
    { count: featuredCount },
    { data: storePhoneRow },
    { data: paidPayments },
  ] = await Promise.all([
    // Orders created today, with payments to tell placed from abandoned.
    supabase
      .from("orders")
      .select("id, payments(status)")
      .gte("created_at", todayISO),
    // Placed but unpaid — same count as the Orders badge.
    supabase
      .from("orders")
      .select("id, payments!inner(id)", { count: "exact", head: true })
      .eq("status", "pending")
      .in("payments.status", ["pending", "processing"]),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer")
      .gte("created_at", todayISO),
    // Each product's own "Low Stock Alert" level (compared below).
    supabase
      .from("products")
      .select("stock_quantity, low_stock_threshold")
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
    // Money actually received: successful payments, all methods.
    supabase
      .from("payments")
      .select("amount, completed_at, provider, provider_metadata, order:orders(status)")
      .eq("status", "successful"),
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

  // Revenue = money actually received (successful payments), dated by when it
  // was paid, leaving out orders later cancelled or refunded.
  type PaidRow = {
    amount: number
    completed_at: string | null
    provider: string
    provider_metadata: { method?: string } | null
    order: { status: string } | null
  }
  const received = ((paidPayments ?? []) as unknown as PaidRow[]).filter(
    (p) => p.order?.status !== "cancelled" && p.order?.status !== "refunded",
  )
  const sum = (rows: PaidRow[]) =>
    rows.reduce((total, p) => total + Number(p.amount), 0)
  const paidToday = (p: PaidRow) => !!p.completed_at && p.completed_at >= todayISO
  const revenueToday = sum(received.filter(paidToday))

  // Orders placed today (abandoned checkouts have no payment record).
  const ordersToday = (
    (todayOrders ?? []) as { payments: { status: string }[] | null }[]
  ).filter((o) =>
    (o.payments ?? []).some((p) =>
      ["pending", "processing", "successful"].includes(p.status),
    ),
  ).length

  const lowStockCount = (stockRows ?? []).filter(
    (p) => p.stock_quantity <= p.low_stock_threshold,
  ).length

  // Mobile Money received: MoMo app checkout + MoMo transfers.
  const appValues = MOMO_PROVIDERS.map((p) => p.value) as string[]
  const momoApp = received.filter((p) => appValues.includes(p.provider))
  const momoTransfer = received.filter(
    (p) => p.provider_metadata?.method === MOMO_MANUAL_VALUE,
  )
  const momoAll = [...momoApp, ...momoTransfer]
  const momoCollectedTotal = sum(momoAll)
  const momoPaymentsCount = momoAll.length
  const momoCollectedToday = sum(momoAll.filter(paidToday))
  // MTN's Collections fee (2.36%, VAT inclusive) applies to MoMo app payments
  // only; transfers to your number arrive in full.
  const MOMO_FEE_RATE = 0.0236
  const momoCollectedNet = sum(momoApp) * (1 - MOMO_FEE_RATE) + sum(momoTransfer)

  const stats = [
    ...(showFinance
      ? [
          {
            title: "Today's Revenue",
            value: formatCurrency(revenueToday),
            icon: DollarSign,
          },
        ]
      : []),
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
      title: "Awaiting Payment",
      value: String(awaitingPaymentCount ?? 0),
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

      {/* First-run onboarding (hides once complete or dismissed); admins only */}
      {can(viewerRole, "settings") && (
        <GettingStarted steps={onboardingSteps} className="dash-rise" />
      )}

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

      {/* Mobile Money received — from our own successful payments (MoMo app
          checkout + verified MoMo transfers). A reconciliation figure, not the
          live MoMo wallet balance; the details sit behind the info button so
          the card stays short. Phones: one row per figure; wider: 3 columns.
          Admins only. */}
      {showFinance && (
        <Card className="dash-rise" style={{ "--i": 5 } as React.CSSProperties}>
          <CardContent className="p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <Wallet className="h-4 w-4" />
              </span>
              <h2 className="flex-1 text-sm font-medium">Mobile Money</h2>
              <Popover>
                <PopoverTrigger
                  aria-label="About these figures"
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Info className="h-4 w-4" />
                </PopoverTrigger>
                <PopoverContent align="end" className="w-64 text-xs leading-relaxed">
                  <p>
                    Confirmed MoMo app and MoMo transfer payments. This
                    isn&apos;t your live MoMo wallet balance.
                  </p>
                  <p className="text-muted-foreground">
                    After fees: MTN keeps 2.36% of MoMo app payments.
                    Transfers to your number arrive in full.
                  </p>
                </PopoverContent>
              </Popover>
            </div>
            <dl className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                {
                  label: "Received",
                  value: momoCollectedTotal,
                  note: `${momoPaymentsCount} payment${momoPaymentsCount === 1 ? "" : "s"}`,
                },
                { label: "After fees", value: momoCollectedNet, accent: true },
                { label: "Today", value: momoCollectedToday },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-baseline justify-between gap-3 py-2.5 first:pt-0 last:pb-0 sm:block sm:px-5 sm:py-0 sm:first:pl-0 sm:last:pr-0"
                >
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {f.label}
                  </dt>
                  <dd className="text-right sm:mt-1 sm:text-left">
                    <span
                      className={`text-lg font-semibold tracking-tight tabular-nums sm:text-2xl ${f.accent ? "text-emerald-600" : ""}`}
                    >
                      {formatCurrency(f.value)}
                    </span>
                    {f.note && (
                      <span className="block text-xs text-muted-foreground">{f.note}</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

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
                  className="flex items-center justify-between gap-3 hover:bg-muted/50 -mx-2 px-2 py-1.5 rounded-md transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-muted flex items-center justify-center">
                      <Package className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium font-mono truncate">
                        {order.order_number}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {order.customer?.full_name || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <Badge
                      variant="secondary"
                      className={`hidden sm:inline-flex text-[0.6rem] ${statusColors[order.status]}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-medium whitespace-nowrap">
                        {formatCurrency(order.total, order.currency)}
                      </p>
                      <p className="text-[0.6rem] text-muted-foreground whitespace-nowrap">
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
              { label: "Add New Product", href: "/admin/products/new", icon: Package, area: "catalog" as const },
              { label: "View Orders", href: "/admin/orders", icon: Clock, area: "orders" as const },
              {
                label: `Low Stock (${lowStockCount})`,
                href: "/admin/products",
                icon: Package,
                area: "catalog" as const,
              },
              { label: "View Analytics", href: "/admin/analytics", icon: TrendingUp, area: "analytics" as const },
            ]
              .filter((action) => can(viewerRole, action.area))
              .map((action) => (
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
