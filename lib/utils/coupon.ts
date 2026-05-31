export interface CouponRow {
  id: string
  type: "percentage" | "fixed_amount" | "free_shipping"
  value: number
  min_order_amount: number | null
  max_uses: number | null
  uses_count: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
}

/**
 * Validate a coupon against the current subtotal and return the computed
 * discount and whether shipping should be free. Returns an error string when
 * the coupon cannot be applied.
 */
export function evaluateCoupon(
  coupon: CouponRow | null,
  subtotal: number,
): { discount: number; freeShipping: boolean; error?: string } {
  if (!coupon)
    return { discount: 0, freeShipping: false, error: "Invalid coupon code" }
  const now = Date.now()
  if (!coupon.is_active)
    return { discount: 0, freeShipping: false, error: "Coupon is not active" }
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now)
    return { discount: 0, freeShipping: false, error: "Coupon is not yet valid" }
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < now)
    return { discount: 0, freeShipping: false, error: "Coupon has expired" }
  if (coupon.max_uses != null && coupon.uses_count >= coupon.max_uses)
    return {
      discount: 0,
      freeShipping: false,
      error: "Coupon usage limit reached",
    }
  if (coupon.min_order_amount != null && subtotal < coupon.min_order_amount)
    return {
      discount: 0,
      freeShipping: false,
      error: `Minimum order of ${coupon.min_order_amount} required`,
    }

  if (coupon.type === "percentage") {
    return { discount: (subtotal * coupon.value) / 100, freeShipping: false }
  }
  if (coupon.type === "fixed_amount") {
    return { discount: Math.min(coupon.value, subtotal), freeShipping: false }
  }
  // free_shipping
  return { discount: 0, freeShipping: true }
}
