import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { ORDER_STATUS_LABELS } from "@/lib/utils/constants"
import { ArrowLeft, ArrowRight, Package } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  processing: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  shipped: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  delivered: "bg-green-500/15 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  refunded: "bg-gray-500/15 text-gray-400 border-gray-500/20",
}

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/account/orders")
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("*, items:order_items(id)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })

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

        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
          Order History
        </p>
        <h1 className="font-serif text-4xl font-light mb-10">
          Your Orders
        </h1>

        {orders && orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between border border-white/[0.06] p-5 hover:border-amber-500/30 transition-colors gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-serif text-base">
                      {order.order_number}
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 text-[0.6rem] font-medium tracking-[0.1em] uppercase border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}
                    >
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#8a8478]">
                    <span>{formatDate(order.created_at)}</span>
                    <span className="w-1 h-1 rounded-full bg-[#8a8478]/40" />
                    <span>
                      {order.items?.length || 0} item{order.items?.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {formatCurrency(order.total, order.currency)}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#8a8478] group-hover:text-amber-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border border-white/[0.06]">
            <Package className="w-10 h-10 text-[#8a8478]/40 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-[#8a8478] mb-4">You haven&apos;t placed any orders yet</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              Start shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
