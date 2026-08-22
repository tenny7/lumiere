import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatDateTime } from "@/lib/utils/format"
import { Card, CardContent } from "@/components/ui/card"
import { MessageSquare, ArrowUpRight } from "lucide-react"

export const dynamic = "force-dynamic"

type Row = {
  order_id: string
  sender_role: "admin" | "customer"
  body: string
  read_at: string | null
  created_at: string
  orders: {
    order_number: string
    customer: { full_name: string | null; email: string | null } | null
  } | null
}

type Thread = {
  orderId: string
  orderNumber: string
  customer: string
  lastBody: string
  lastAt: string
  unread: number
}

export default async function AdminSupportPage() {
  const supabase = await createClient()

  // is_admin RLS gives admins access to all threads.
  const { data } = await supabase
    .from("support_messages")
    .select(
      "order_id, sender_role, body, read_at, created_at, orders(order_number, customer:profiles(full_name, email))",
    )
    .order("created_at", { ascending: false })

  const rows = (data || []) as unknown as Row[]
  const byOrder = new Map<string, Thread>()
  for (const r of rows) {
    let t = byOrder.get(r.order_id)
    if (!t) {
      t = {
        orderId: r.order_id,
        orderNumber: r.orders?.order_number || "Order",
        customer:
          r.orders?.customer?.full_name || r.orders?.customer?.email || "—",
        lastBody: r.body,
        lastAt: r.created_at,
        unread: 0,
      }
      byOrder.set(r.order_id, t)
    }
    if (r.sender_role === "customer" && !r.read_at) t.unread += 1
  }
  const threads = Array.from(byOrder.values())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground">
          Customer conversations, one thread per order.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No customer conversations yet.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {threads.map((t) => (
                <li key={t.orderId}>
                  <Link
                    href={`/admin/support/${t.orderId}`}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {t.orderNumber}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t.customer}
                        </span>
                        {t.unread > 0 && (
                          <span className="inline-flex items-center justify-center rounded-full bg-amber-500 text-black text-[0.6rem] font-semibold px-2 py-0.5">
                            {t.unread} new
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {t.lastBody}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {formatDateTime(t.lastAt)}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
