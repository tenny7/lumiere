import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const roleColors: Record<string, string> = {
  customer: "bg-gray-500/10 text-gray-500",
  sales_agent: "bg-blue-500/10 text-blue-500",
  inventory_manager: "bg-purple-500/10 text-purple-500",
  admin: "bg-amber-500/10 text-amber-500",
  super_admin: "bg-red-500/10 text-red-500",
}

const roleLabels: Record<string, string> = {
  customer: "Customer",
  sales_agent: "Sales Agent",
  inventory_manager: "Inventory",
  admin: "Admin",
  super_admin: "Super Admin",
}

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>
}) {
  const { role } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("profiles")
    .select("*, orders(count, total)")
    .order("created_at", { ascending: false })
    .limit(100)

  if (role && role !== "all") {
    query = query.eq("role", role)
  }

  const { data: profiles } = await query

  const customers = (profiles ?? []).map((profile) => {
    const orders = profile.orders as unknown as
      | { count: number; total: number }[]
      | null
    const orderCount = orders?.length
      ? (orders[0] as { count: number }).count
      : 0
    const totalSpent = orders?.reduce(
      (sum: number, o: { total: number }) => sum + (o.total ?? 0),
      0
    ) ?? 0
    return { ...profile, orderCount, totalSpent }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
        <p className="text-sm text-muted-foreground">
          View and manage customer accounts
        </p>
      </div>

      {/* Role filter */}
      <div className="flex gap-2">
        {[
          { value: "all", label: "All" },
          { value: "customer", label: "Customers" },
          { value: "sales_agent", label: "Staff" },
          { value: "admin", label: "Admins" },
        ].map((filter) => {
          const isActive = (role ?? "all") === filter.value
          return (
            <a
              key={filter.value}
              href={
                filter.value === "all"
                  ? "/admin/customers"
                  : `/admin/customers?role=${filter.value}`
              }
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/20"
              }`}
            >
              {filter.label}
            </a>
          )
        })}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  {customer.full_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {customer.email}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-xs">
                  {customer.phone || "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`text-[0.6rem] ${roleColors[customer.role] ?? ""}`}
                  >
                    {roleLabels[customer.role] ?? customer.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {customer.orderCount}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(customer.totalSpent)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(customer.created_at)}
                </TableCell>
              </TableRow>
            ))}
            {customers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  No customers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
