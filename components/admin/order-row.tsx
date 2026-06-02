"use client"

import { useRouter } from "next/navigation"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDateTime } from "@/lib/utils/format"
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/utils/constants"

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

type Order = {
  id: string
  order_number: string
  total: number
  currency: string
  status: string
  created_at: string
  customer?: { full_name: string; email: string } | null
  payments?: { status: string; provider: string }[]
}

export function OrderRow({ order }: { order: Order }) {
  const router = useRouter()
  const payment = order.payments?.[0]
  const href = `/admin/orders/${order.id}`

  return (
    <TableRow
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter") router.push(href)
      }}
      tabIndex={0}
      role="link"
      aria-label={`Open order ${order.order_number}`}
      className="cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <TableCell className="font-medium font-mono text-sm">
        {order.order_number}
      </TableCell>
      <TableCell>
        <p className="text-sm">{order.customer?.full_name}</p>
        <p className="text-xs text-muted-foreground">{order.customer?.email}</p>
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
}
