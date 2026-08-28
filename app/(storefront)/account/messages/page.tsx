import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatDateTime } from "@/lib/utils/format"
import { ArrowLeft, ArrowRight, MessageSquare } from "lucide-react"
import { NewMessageButton, type OrderOption } from "@/components/support/new-message-button"

export const dynamic = "force-dynamic"

type Row = {
  order_id: string
  sender_role: "admin" | "customer"
  body: string
  read_at: string | null
  created_at: string
  orders: { order_number: string; customer_id: string } | null
}

type Thread = {
  orderId: string
  orderNumber: string
  lastBody: string
  lastAt: string
  unread: number
}

export default async function MessagesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login?redirect=/account/messages")

  // Scope explicitly to the signed-in user's OWN orders. Relying on RLS alone
  // breaks for staff/admins, whose policies can see every order's messages —
  // which would list other customers' orders here and 404 on open.
  const { data } = await supabase
    .from("support_messages")
    .select(
      "order_id, sender_role, body, read_at, created_at, orders!inner(order_number, customer_id)",
    )
    .eq("orders.customer_id", user.id)
    .order("created_at", { ascending: false })

  // The user's own orders, for starting a new conversation.
  const { data: orderRows } = await supabase
    .from("orders")
    .select("id, order_number, status, created_at")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100)

  const rows = (data || []) as unknown as Row[]
  const byOrder = new Map<string, Thread>()
  for (const r of rows) {
    let t = byOrder.get(r.order_id)
    if (!t) {
      t = {
        orderId: r.order_id,
        orderNumber: r.orders?.order_number || "Order",
        lastBody: r.body,
        lastAt: r.created_at,
        unread: 0,
      }
      byOrder.set(r.order_id, t)
    }
    if (r.sender_role === "admin" && !r.read_at) t.unread += 1
  }
  const threads = Array.from(byOrder.values())

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-[#8a8478] hover:text-[#f5f0e8] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          My Account
        </Link>

        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
              Support
            </p>
            <h1 className="font-serif text-4xl font-light">Messages</h1>
          </div>
          <NewMessageButton orders={(orderRows || []) as OrderOption[]} />
        </div>

        {threads.length > 0 ? (
          <div className="space-y-3">
            {threads.map((t) => (
              <Link
                key={t.orderId}
                href={`/account/messages/${t.orderId}`}
                className="group flex items-center justify-between border border-white/[0.06] p-5 hover:border-amber-500/30 transition-colors gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-serif text-base">{t.orderNumber}</span>
                    {t.unread > 0 && (
                      <span className="inline-flex items-center justify-center rounded-full bg-amber-500 text-black text-[0.6rem] font-semibold px-2 py-0.5">
                        {t.unread} new
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#8a8478] truncate">{t.lastBody}</p>
                  <p className="text-xs text-[#8a8478]/70 mt-1">
                    {formatDateTime(t.lastAt)}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8a8478] group-hover:text-amber-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-white/[0.06]">
            <MessageSquare
              className="w-10 h-10 text-[#8a8478]/40 mx-auto mb-4"
              strokeWidth={1.5}
            />
            <p className="text-[#8a8478] mb-6">No messages yet.</p>
            <NewMessageButton orders={(orderRows || []) as OrderOption[]} />
          </div>
        )}
      </div>
    </div>
  )
}
