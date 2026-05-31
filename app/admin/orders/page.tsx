import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/utils/constants"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  confirmed: "bg-blue-500/10 text-blue-500",
  processing: "bg-purple-500/10 text-purple-500",
  shipped: "bg-cyan-500/10 text-cyan-500",
  delivered: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
  refunded: "bg-gray-500/10 text-gray-500",
}

const paymentColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  processing: "bg-blue-500/10 text-blue-500",
  successful: "bg-green-500/10 text-green-500",
  failed: "bg-red-500/10 text-red-500",
  refunded: "bg-gray-500/10 text-gray-500",
}

export default async function AdminOrdersPage() {
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from("orders")
    .select("*, customer:profiles(full_name, email), payments(status, provider)")
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
        <p className="text-sm text-muted-foreground">
          Manage and track all customer orders
        </p>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders?.map((order) => {
              const payment = order.payments?.[0]
              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium font-mono text-sm hover:underline"
                    >
                      {order.order_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{order.customer?.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer?.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.total, order.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-[0.6rem] ${statusColors[order.status]}`}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {payment ? (
                      <Badge
                        variant="secondary"
                        className={`text-[0.6rem] ${paymentColors[payment.status]}`}
                      >
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateTime(order.created_at)}
                  </TableCell>
                </TableRow>
              )
            })}
            {(!orders || orders.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  No orders yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
