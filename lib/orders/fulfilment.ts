import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"

// Stock and coupon accounting for an order, each applied at most once.
//
// Each helper first "claims" a flag on the order with a conditional update
// (only flips it if it isn't already in the target state), so concurrent
// callers — e.g. the MoMo webhook and status polling reporting the same
// success — can't double-count. Flags come from migration 00019; until it is
// applied the claim errors, and we fall back to the previous behaviour.
// Call with the service-role client.

type OrderItem = {
  product_id: string | null
  variant_id: string | null
  quantity: number
}

async function getItems(db: SupabaseClient, orderId: string) {
  const { data } = await db
    .from("order_items")
    .select("product_id, variant_id, quantity")
    .eq("order_id", orderId)
  return (data ?? []) as OrderItem[]
}

async function applyStock(
  db: SupabaseClient,
  items: OrderItem[],
  direction: "decrement" | "increment",
) {
  for (const item of items) {
    if (item.variant_id) {
      await db.rpc(`${direction}_variant_stock`, {
        p_variant_id: item.variant_id,
        p_quantity: item.quantity,
      })
    } else if (item.product_id) {
      await db.rpc(`${direction}_product_stock`, {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })
    }
  }
}

/**
 * Take the order's items out of stock (once). Call when payment succeeds.
 *
 * `legacyFallback`: if the flag column is missing (pre-00019), deduct anyway,
 * matching the old behaviour of the payment-success paths. Pass false where
 * the old code never deducted (e.g. restoring a cancelled order), so a status
 * change can't take stock twice.
 */
export async function deductStock(
  db: SupabaseClient,
  orderId: string,
  { legacyFallback = true }: { legacyFallback?: boolean } = {},
) {
  const { data, error } = await db
    .from("orders")
    .update({ stock_deducted: true })
    .eq("id", orderId)
    .eq("stock_deducted", false)
    .select("id")
  if (error) {
    if (!legacyFallback) return
  } else if ((data?.length ?? 0) === 0) {
    return // already deducted for this order
  }
  await applyStock(db, await getItems(db, orderId), "decrement")
}

/** Put a paid order's items back in stock (once). Call on cancel/refund. */
export async function restoreStock(db: SupabaseClient, orderId: string) {
  const { data, error } = await db
    .from("orders")
    .update({ stock_deducted: false })
    .eq("id", orderId)
    .eq("stock_deducted", true)
    .select("id")
  // Nothing was deducted, already restored, or flag missing (pre-00019).
  if (error || (data?.length ?? 0) === 0) return
  await applyStock(db, await getItems(db, orderId), "increment")
}

/**
 * Count one use of the order's coupon (once). Call when the order is actually
 * placed (Cash on Delivery, MoMo transfer notice, MoMo success, Mark Paid), so
 * abandoned checkouts don't use up a coupon.
 */
export async function redeemCoupon(db: SupabaseClient, orderId: string) {
  const { data, error } = await db
    .from("orders")
    .update({ coupon_redeemed: true })
    .eq("id", orderId)
    .eq("coupon_redeemed", false)
    .not("coupon_id", "is", null)
    .select("coupon_id")
  if (error) {
    console.error("Coupon redemption skipped (run migration 00019):", error.message)
    return
  }
  const couponId = data?.[0]?.coupon_id as string | undefined
  if (couponId) {
    await db.rpc("increment_coupon_uses", { p_coupon_id: couponId })
  }
}
