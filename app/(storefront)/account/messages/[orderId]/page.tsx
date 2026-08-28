import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SupportThread, type SupportMessage } from "@/components/support/support-thread"

export const dynamic = "force-dynamic"

export default async function OrderChatPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/account/messages/${orderId}`)

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, customer_id")
    .eq("id", orderId)
    .single()
  if (!order || order.customer_id !== user.id) notFound()

  // Has an admin suspended this customer's messaging?
  const { data: me } = await supabase
    .from("profiles")
    .select("support_blocked")
    .eq("id", user.id)
    .single()

  // Latest page of messages (ascending for display).
  const { data: rows } = await supabase
    .from("support_messages")
    .select("id, sender_role, body, read_at, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(31)
  const hasMore = (rows || []).length > 30
  const page = (hasMore ? (rows || []).slice(0, 30) : rows || []).reverse()

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/account/messages"
          className="inline-flex items-center gap-2 text-sm text-[#8a8478] hover:text-[#f5f0e8] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All messages
        </Link>

        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-2">
          Support
        </p>
        <h1 className="font-serif text-3xl font-light mb-1">
          Order {order.order_number}
        </h1>
        <p className="text-sm text-[#8a8478] mb-6">
          Message us about this order — we&apos;ll reply here and email you.{" "}
          <Link
            href={`/account/orders/${order.id}`}
            className="text-amber-400 hover:text-amber-300"
          >
            View order details
          </Link>
        </p>

        <SupportThread
          orderId={order.id}
          role="customer"
          initialMessages={page as SupportMessage[]}
          initialHasMore={hasMore}
          blocked={!!me?.support_blocked}
        />
      </div>
    </div>
  )
}
