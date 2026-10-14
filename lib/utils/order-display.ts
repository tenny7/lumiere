import {
  ORDER_STATUS_LABELS,
  COD_METHOD_VALUE,
  MOMO_MANUAL_VALUE,
  MOMO_PROVIDERS,
} from "./constants"

type PaymentLike = { provider_metadata?: unknown } | null | undefined

// How a payment was made, for invoices/receipts. Manual payments carry their
// method in provider_metadata; gateway payments are identified by provider.
export function paymentMethodLabel(
  payment: { provider?: string | null; provider_metadata?: unknown } | null | undefined,
): string {
  const method = (payment?.provider_metadata as { method?: string } | null)
    ?.method
  if (method === MOMO_MANUAL_VALUE) return "MoMo transfer"
  if (method === COD_METHOD_VALUE) return "Cash on delivery"
  const gateway = MOMO_PROVIDERS.find((m) => m.value === payment?.provider)
  if (gateway) return gateway.label
  return "Confirmed by store"
}

// Is this a Cash-on-Delivery order? COD payments are recorded against the
// `manual` provider with provider_metadata.method = "cash_on_delivery".
export function isCodOrder(payments: PaymentLike[] | PaymentLike): boolean {
  const list = Array.isArray(payments) ? payments : [payments]
  return list.some(
    (p) =>
      (p?.provider_metadata as { method?: string } | null)?.method ===
      COD_METHOD_VALUE,
  )
}

// Customer-facing order status. A pending Cash-on-Delivery order reads as
// "Order Placed · Cash on Delivery" instead of a bare "Pending", which can look
// like the order failed. Every other status uses the normal label.
export function orderStatusLabel(status: string, cod: boolean): string {
  if (cod && status === "pending") return "Order Placed · Cash on Delivery"
  return ORDER_STATUS_LABELS[status] || status
}

// Key to look up in a page's status-colour map (COD pending gets its own green
// entry, `cod_pending`).
export function orderStatusColorKey(status: string, cod: boolean): string {
  if (cod && status === "pending") return "cod_pending"
  return status
}
