import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/utils/constants"
import { ArrowLeft, MapPin, Check, Truck, ExternalLink } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  processing: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  shipped: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  delivered: "bg-green-500/15 text-green-400 border-green-500/20",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/20",
  refunded: "bg-gray-500/15 text-gray-400 border-gray-500/20",
}

const PAYMENT_COLORS: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  processing: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  successful: "bg-green-500/15 text-green-400 border-green-500/20",
  failed: "bg-red-500/15 text-red-400 border-red-500/20",
  refunded: "bg-gray-500/15 text-gray-400 border-gray-500/20",
}

const TIMELINE_STEPS = ["confirmed", "processing", "shipped", "delivered"] as const

type ShippingAddress = {
  full_name?: string
  line_1?: string
  line_2?: string
  city?: string
  region?: string
  phone?: string
  country?: string
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/account/orders")
  }

  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*, product:products(name, slug))")
    .eq("id", id)
    .single()

  if (!order) notFound()

  // Verify the order belongs to the logged-in user
  if (order.customer_id !== user.id) notFound()

  // Latest payment status (orders don't store payment status directly)
  const { data: payment } = await supabase
    .from("payments")
    .select("status")
    .eq("order_id", id)
    .order("initiated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const address = (order.shipping_address || {}) as ShippingAddress
  const currency: string = order.currency || "RWF"

  const isCancelled = order.status === "cancelled" || order.status === "refunded"
  const currentStep = TIMELINE_STEPS.indexOf(order.status)

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-sm text-[#8a8478] hover:text-[#f5f0e8] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          All Orders
        </Link>

        {/* Header */}
        <div className="mb-10">
          <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
            Order Details
          </p>
          <h1 className="font-serif text-4xl font-light mb-3">
            {order.order_number}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-[#8a8478]">
              {formatDate(order.created_at)}
            </span>
            <span
              className={`inline-flex px-2 py-0.5 text-[0.6rem] font-medium tracking-[0.1em] uppercase border ${STATUS_COLORS[order.status] || STATUS_COLORS.pending}`}
            >
              {ORDER_STATUS_LABELS[order.status] || order.status}
            </span>
            {payment?.status && (
              <span
                className={`inline-flex px-2 py-0.5 text-[0.6rem] font-medium tracking-[0.1em] uppercase border ${PAYMENT_COLORS[payment.status] || PAYMENT_COLORS.pending}`}
              >
                Payment: {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
              </span>
            )}
          </div>
        </div>

        {/* Tracking timeline */}
        <div className="mb-10">
          <h2 className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-5">
            Tracking
          </h2>

          {isCancelled ? (
            <div
              className={`border p-5 text-sm ${STATUS_COLORS[order.status]}`}
            >
              This order was {ORDER_STATUS_LABELS[order.status]?.toLowerCase()}.
            </div>
          ) : order.status === "pending" ? (
            <div className="border border-amber-500/20 bg-amber-500/[0.06] p-5 text-sm text-amber-300/90">
              Awaiting payment confirmation. Your tracking will update once payment
              is received.
            </div>
          ) : (
            <ol className="flex items-center">
              {TIMELINE_STEPS.map((step, i) => {
                const done = i <= currentStep
                const isLast = i === TIMELINE_STEPS.length - 1
                return (
                  <li
                    key={step}
                    className="flex items-center flex-1 last:flex-none"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span
                        className={`flex items-center justify-center w-9 h-9 rounded-full border ${
                          done
                            ? "bg-amber-500 border-amber-500 text-black"
                            : "border-white/15 text-[#8a8478]"
                        }`}
                      >
                        {done ? (
                          <Check className="w-4 h-4" strokeWidth={2.5} />
                        ) : (
                          <span className="text-xs">{i + 1}</span>
                        )}
                      </span>
                      <span
                        className={`text-[0.6rem] tracking-[0.1em] uppercase ${
                          done ? "text-[#f5f0e8]" : "text-[#8a8478]"
                        }`}
                      >
                        {ORDER_STATUS_LABELS[step]}
                      </span>
                    </div>
                    {!isLast && (
                      <span
                        className={`flex-1 h-px mx-2 -mt-6 ${
                          i < currentStep ? "bg-amber-500" : "bg-white/15"
                        }`}
                      />
                    )}
                  </li>
                )
              })}
            </ol>
          )}

          {/* Tracking number / carrier */}
          {order.tracking_number && (
            <div className="mt-6 bg-[#1a1918] border border-white/[0.03] p-5">
              <div className="flex items-start gap-3">
                <Truck className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  {order.tracking_carrier && (
                    <p className="text-[#8a8478]">
                      Carrier:{" "}
                      <span className="text-[#f5f0e8]">
                        {order.tracking_carrier}
                      </span>
                    </p>
                  )}
                  <p className="text-[#8a8478]">
                    Tracking #:{" "}
                    <span className="text-[#f5f0e8] font-medium tracking-wide">
                      {order.tracking_number}
                    </span>
                  </p>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors mt-2"
                    >
                      Track shipment
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Items */}
        <div className="mb-8">
          <h2 className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-4">
            Items
          </h2>
          <div className="border border-white/[0.06] divide-y divide-white/[0.06]">
            {order.items?.map(
              (item: {
                id: string
                product_name: string
                quantity: number
                unit_price: number
                total_price: number
                product?: { name: string; slug: string } | null
              }) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex-1 min-w-0">
                    {item.product?.slug ? (
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="font-serif text-sm hover:text-amber-400 transition-colors"
                      >
                        {item.product_name}
                      </Link>
                    ) : (
                      <span className="font-serif text-sm">
                        {item.product_name}
                      </span>
                    )}
                    <p className="text-xs text-[#8a8478] mt-0.5">
                      {formatCurrency(item.unit_price, currency)} x {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-medium ml-4">
                    {formatCurrency(item.total_price, currency)}
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-8">
          <h2 className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-4">
            Summary
          </h2>
          <div className="bg-[#1a1918] border border-white/[0.03] p-5 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#8a8478]">Subtotal</span>
              <span>{formatCurrency(order.subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8a8478]">Delivery Fee</span>
              <span>
                {order.delivery_fee > 0
                  ? formatCurrency(order.delivery_fee, currency)
                  : "Free"}
              </span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#8a8478]">Discount</span>
                <span className="text-green-400">
                  -{formatCurrency(order.discount_amount, currency)}
                </span>
              </div>
            )}
            <div className="border-t border-white/5 pt-3 mt-3 flex justify-between font-medium">
              <span>Total</span>
              <span>{formatCurrency(order.total, currency)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {(address.line_1 || address.full_name) && (
          <div className="mb-8">
            <h2 className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-4">
              Shipping Address
            </h2>
            <div className="bg-[#1a1918] border border-white/[0.03] p-5">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#8a8478] mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  {address.full_name && <p>{address.full_name}</p>}
                  {address.line_1 && (
                    <p className="text-[#8a8478]">{address.line_1}</p>
                  )}
                  {address.line_2 && (
                    <p className="text-[#8a8478]">{address.line_2}</p>
                  )}
                  <p className="text-[#8a8478]">
                    {address.city}
                    {address.region && `, ${address.region}`}
                  </p>
                  {address.phone && (
                    <p className="text-[#8a8478] mt-1">{address.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to orders
        </Link>
      </div>
    </div>
  )
}
