import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { PrintButton } from "./print-button"

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

  // RLS lets the order's own customer OR any staff member read it.
  const { data: order } = await supabase
    .from("orders")
    .select(
      "*, items:order_items(product_name, product_sku, quantity, unit_price, total_price), customer:profiles(full_name, email, phone)",
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
  const storeAddr = settings.store_address as
    | { line_1?: string; city?: string; region?: string; country?: string }
    | undefined

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

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 py-8 px-4 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl">
        {/* Actions (hidden when printing) */}
        <div className="print:hidden mb-4 flex items-center justify-between">
          <a
            href={`/account/orders/${id}`}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            &larr; Back to order
          </a>
          <PrintButton />
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
                {storeAddr && (
                  <p>
                    {[storeAddr.line_1, storeAddr.city, storeAddr.region, storeAddr.country]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                {storeEmail && <p className="break-all">{storeEmail}</p>}
                {storePhone && <p>{storePhone}</p>}
              </div>
            </div>
            <div className="shrink-0 sm:text-right">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                Invoice
              </p>
              <p className="mt-1 font-mono text-base font-semibold whitespace-nowrap text-neutral-900">
                {order.order_number}
              </p>
              <p className="text-sm text-neutral-500">
                {formatDate(order.created_at)}
              </p>
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium capitalize text-neutral-700">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                {order.status}
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
                <span>Total</span>
                <span className="tabular-nums">
                  {formatCurrency(order.total, currency)}
                </span>
              </div>
            </div>
          </div>

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
