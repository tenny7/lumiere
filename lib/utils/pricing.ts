// Order pricing shared by checkout (display) and the server (what is charged),
// so the two can never disagree. Pure — safe on client and server.

export type PricingSettings = {
  /** Flat delivery fee (Admin → Settings → Payments). */
  deliveryFee: number
  /** Subtotal at or above which delivery is free. 0 = no free-delivery tier. */
  freeShippingThreshold: number
  /** VAT rate in percent, e.g. 18. Added on top of the goods total. */
  taxRate: number
}

export const PRICING_SETTING_KEYS = [
  "delivery_fee",
  "free_shipping_threshold",
  "store_tax_rate",
] as const

function toNumber(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) && n > 0 ? n : 0
}

/** Build pricing settings from store_settings rows (values are JSONB). */
export function parsePricingSettings(
  rows: { key: string; value: unknown }[] | null | undefined,
): PricingSettings {
  const map = new Map((rows || []).map((r) => [r.key, r.value]))
  return {
    deliveryFee: toNumber(map.get("delivery_fee")),
    freeShippingThreshold: toNumber(map.get("free_shipping_threshold")),
    taxRate: toNumber(map.get("store_tax_rate")),
  }
}

// RWF has no minor unit; other currencies keep cents.
function roundMoney(amount: number, currency: string): number {
  return currency === "RWF"
    ? Math.round(amount)
    : Math.round(amount * 100) / 100
}

export type OrderTotals = {
  subtotal: number
  discount: number
  deliveryFee: number
  taxAmount: number
  total: number
}

/**
 * Total = (subtotal − discount) + VAT on that amount + delivery. Each charge is
 * added exactly once. Delivery is free when a coupon grants it or the subtotal
 * reaches the free-delivery threshold.
 */
export function computeOrderTotals({
  subtotal,
  discount,
  couponFreeShipping,
  settings,
  currency,
}: {
  subtotal: number
  discount: number
  couponFreeShipping: boolean
  settings: PricingSettings
  currency: string
}): OrderTotals {
  const goods = Math.max(subtotal - discount, 0)
  const freeByThreshold =
    settings.freeShippingThreshold > 0 &&
    subtotal >= settings.freeShippingThreshold
  const deliveryFee =
    couponFreeShipping || freeByThreshold ? 0 : settings.deliveryFee
  const taxAmount = roundMoney((goods * settings.taxRate) / 100, currency)
  const total = roundMoney(goods + taxAmount + deliveryFee, currency)
  return { subtotal, discount, deliveryFee, taxAmount, total }
}
