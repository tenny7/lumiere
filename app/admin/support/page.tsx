import { createClient } from "@/lib/supabase/server"
import {
  SupportThreadList,
  type SupportThreadRow,
} from "@/components/admin/support-thread-list"

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
  const byOrder = new Map<string, SupportThreadRow>()
  for (const r of rows) {
    let t = byOrder.get(r.order_id)
    if (!t) {
      t = {
        orderId: r.order_id,
        orderNumber: r.orders?.order_number || "Order",
        customer:
          r.orders?.customer?.full_name || r.orders?.customer?.email || "—",
        customerEmail: r.orders?.customer?.email || "",
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

      <SupportThreadList threads={threads} />
    </div>
  )
}
