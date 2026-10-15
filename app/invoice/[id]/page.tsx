import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { paymentMethodLabel } from "@/lib/utils/order-display"
import { PrintButton } from "./print-button"
import { ReceiptPdfButton, type ReceiptData } from "./receipt-pdf-button"

type SettingsMap = Record<string, unknown>

function settingString(map: SettingsMap, key: string, fallback = ""): string {
  const v = map[key]
  return typeof v === "string" ? v : fallback
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=/invoice/${id}`)

  // Route "Back" by role: staff came from the admin order page, customers from
  // their own order page. (The invoice opens in a new tab, so there's no browser
  // history to go back to.)
  const { data: viewerProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  const isStaff =
    !!viewerProfile && ["admin", "super_admin"].includes(viewerProfile.role)
  const backHref = isStaff ? `/admin/orders/${id}` : `/account/orders/${id}`

  // RLS lets the order's own customer OR any staff member read it.
  const { data: order } = await supabase
    .from("orders")
    .select(
      "*, items:order_items(product_name, product_sku, quantity, unit_price, total_price), customer:profiles(full_name, email, phone), payments(status, provider, provider_metadata, completed_at)",
    )
    .eq("id", id)
    .single()

  if (!order) notFound()

  // Store details for the "from" block.
  const { data: settingsRows } = await supabase
    .from("store_settings")
    .select("key, value")
    .in("key", ["store_name", "store_email", "store_phone", "store_address"])

  const settings: SettingsMap = {}
  for (const row of settingsRows || []) settings[row.key] = row.value

  const storeName = settingString(settings, "store_name", "Ajabu Lighting")
  const storeEmail = settingString(settings, "store_email")
  const storePhone = settingString(settings, "store_phone")
  // The General settings field saves plain text; older data stored an object
  // ({ line_1, city, region, country }). Accept both.
  const rawAddr = settings.store_address
  const storeAddress =
    typeof rawAddr === "string"
      ? rawAddr.trim()
      : rawAddr && typeof rawAddr === "object"
        ? (() => {
            const a = rawAddr as {
              line_1?: string
              city?: string
              region?: string
              country?: string
            }
            return [a.line_1, a.city, a.region, a.country]
              .filter(Boolean)
              .join(", ")
          })()
        : ""

  const currency: string = order.currency || "RWF"
  const ship = (order.shipping_address || {}) as {
    full_name?: string
    line_1?: string
    line_2?: string
    city?: string
    region?: string
    phone?: string
    country?: string
  }

  type Item = {
    product_name: string
    product_sku: string | null
    quantity: number
    unit_price: number
    total_price: number
  }
  const items = (order.items || []) as Item[]

  // A receipt is proof of payment, so it only exists once money was received
  // (admin marked it paid, or a MoMo payment succeeded). Until then this is an
  // invoice marked "Payment pending".
  type PaymentInfo = {
    status: string
    provider: string
    provider_metadata: unknown
    completed_at: string | null
  }
  const payments = (order.payments || []) as PaymentInfo[]
  const paidPayment = payments.find((p) => p.status === "successful")
  const isClosed = order.status === "cancelled" || order.status === "refunded"
  const isPaid = !!paidPayment && !isClosed
  const docType: "receipt" | "invoice" = isPaid ? "receipt" : "invoice"
  const statusLabel =
    order.status === "cancelled"
      ? "Cancelled"
      : order.status === "refunded"
        ? "Refunded"
        : isPaid
          ? "Paid"
          : "Payment pending"
  const paidOn = isPaid ? paidPayment?.completed_at ?? null : null
  const paidVia = isPaid ? paymentMethodLabel(paidPayment) : ""
  const statusStyle = isPaid
    ? { chip: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" }
    : isClosed
      ? { chip: "bg-neutral-100 text-neutral-700", dot: "bg-neutral-400" }
      : { chip: "bg-amber-50 text-amber-800", dot: "bg-amber-500" }
  const totalLabel = isPaid ? "Total paid" : isClosed ? "Total" : "Amount due"

  const receiptData: ReceiptData = {
    storeName,
    storeEmail,
    storePhone,
    storeAddress,
    docType,
    statusLabel,
    paidOn,
    paidVia,
    totalLabel,
    orderNumber: order.order_number,
    createdAt: order.created_at,
    currency,
    billToName: ship.full_name || order.customer?.full_name || "Customer",
    billToEmail: order.customer?.email || "",
    billToAddress: [ship.line_1, ship.line_2, ship.city, ship.region, ship.country]
      .filter(Boolean)
      .join(", "),
    billToPhone: ship.phone || order.customer?.phone || "",
    items: items.map((it) => ({
      name: it.product_name,
      sku: it.product_sku,
      quantity: it.quantity,
      unitPrice: it.unit_price,
      totalPrice: it.total_price,
    })),
    subtotal: order.subtotal,
    discount: order.discount_amount || 0,
    deliveryFee: order.delivery_fee || 0,
    tax: order.tax_amount || 0,
    total: order.total,
  }

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 py-8 px-4 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl">
        {/* Actions (hidden when printing) */}
        <div className="print:hidden mb-4 flex items-center justify-between">
          <a
            href={backHref}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            &larr; Back to order
          </a>
          <div className="flex items-center gap-2">
            <PrintButton />
            <ReceiptPdfButton data={receiptData} />
          </div>
        </div>

        {/* Invoice document */}
        <div className="bg-white shadow-sm print:shadow-none border border-neutral-200 print:border-0 p-6 sm:p-12">
          {/* Header */}
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-10">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900">
                {storeName}
              </h1>
              <div className="mt-1.5 space-y-0.5 text-sm text-neutral-500">
                {storeAddress && <p>{storeAddress}</p>}
                {storeEmail && <p className="break-all">{storeEmail}</p>}
                {storePhone && <p>{storePhone}</p>}
              </div>
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                {docType === "receipt" ? "Receipt" : "Invoice"}
              </p>
              <p className="mt-1 font-mono text-base font-semibold whitespace-nowrap text-neutral-900">
                {order.order_number}
              </p>
              <p className="text-sm text-neutral-500">
                {formatDate(order.created_at)}
              </p>
              <span
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle.chip}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Bill to */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Bill To
            </p>
            <p className="text-sm font-medium">
              {ship.full_name || order.customer?.full_name || "Customer"}
            </p>
            {order.customer?.email && (
              <p className="text-sm text-neutral-500">{order.customer.email}</p>
            )}
            {ship.line_1 && (
              <p className="text-sm text-neutral-500">
                {ship.line_1}
                {ship.line_2 ? `, ${ship.line_2}` : ""}
              </p>
            )}
            {(ship.city || ship.region) && (
              <p className="text-sm text-neutral-500">
                {[ship.city, ship.region, ship.country].filter(Boolean).join(", ")}
              </p>
            )}
            {(ship.phone || order.customer?.phone) && (
              <p className="text-sm text-neutral-500">
                {ship.phone || order.customer?.phone}
              </p>
            )}
          </div>

          {/* Items */}
          <table className="w-full text-sm mb-8">
            <thead>
              <tr className="border-b border-neutral-300 text-left text-xs uppercase tracking-wider text-neutral-400">
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 font-medium text-center">Qty</th>
                <th className="py-2 font-medium text-right">Unit Price</th>
                <th className="py-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  <td className="py-3">
                    <span className="font-medium">{item.product_name}</span>
                    {item.product_sku && (
                      <span className="block text-xs text-neutral-400">
                        {item.product_sku}
                      </span>
                    )}
                  </td>
                  <td className="py-3 text-center tabular-nums">{item.quantity}</td>
                  <td className="py-3 text-right tabular-nums">
                    {formatCurrency(item.unit_price, currency)}
                  </td>
                  <td className="py-3 text-right tabular-nums">
                    {formatCurrency(item.total_price, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span className="tabular-nums">
                  {formatCurrency(order.subtotal, currency)}
                </span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Discount</span>
                  <span className="tabular-nums">
                    −{formatCurrency(order.discount_amount, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-500">Delivery</span>
                <span className="tabular-nums">
                  {order.delivery_fee > 0
                    ? formatCurrency(order.delivery_fee, currency)
                    : "Free"}
                </span>
              </div>
              {order.tax_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-500">Tax</span>
                  <span className="tabular-nums">
                    {formatCurrency(order.tax_amount, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-neutral-300 pt-2 mt-2 text-base font-semibold">
                <span>{totalLabel}</span>
                <span className="tabular-nums">
                  {formatCurrency(order.total, currency)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment */}
          {isPaid ? (
            <p className="mt-8 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Paid
              {paidOn ? ` on ${formatDate(paidOn)}` : ""}
              {paidVia ? ` via ${paidVia}` : ""}.
            </p>
          ) : !isClosed ? (
            <p className="mt-8 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Payment pending. This invoice is not proof of payment; a receipt
              is issued once payment is confirmed.
            </p>
          ) : null}

          {/* Footer */}
          <div className="mt-12 border-t border-neutral-200 pt-6 text-center">
            <p className="text-sm text-neutral-500">
              Thank you for your business.
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {storeName}
              {storeEmail ? ` · ${storeEmail}` : ""}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
