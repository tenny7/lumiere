import type { SupabaseClient } from "@supabase/supabase-js"

interface GuestCartItem {
  productId: string
  variantId?: string
  quantity: number
}

/**
 * Once a product is in the cart it no longer belongs on the wishlist. Deletes
 * the user's wishlist row for it (a no-op when it isn't wishlisted). Returns
 * true when a row was removed, so callers can refresh wishlist UI and counts.
 */
export async function removeFromWishlist(
  supabase: SupabaseClient,
  userId: string,
  productId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("wishlists")
    .delete()
    .eq("profile_id", userId)
    .eq("product_id", productId)
    .select("id")
  return !error && (data?.length ?? 0) > 0
}

/**
 * Merge a guest's localStorage cart into their persistent DB cart after they
 * authenticate, then clear the local copy. Quantities for items already in the
 * DB cart are added together. Safe to call when there is no guest cart.
 */
export async function mergeGuestCart(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  let guestCart: GuestCartItem[] = []
  try {
    guestCart = JSON.parse(localStorage.getItem("lumiere_cart") || "[]")
  } catch {
    guestCart = []
  }

  if (!Array.isArray(guestCart) || guestCart.length === 0) return

  // Load existing DB cart to compute merged quantities.
  const { data: existing } = await supabase
    .from("cart_items")
    .select("product_id, variant_id, quantity")
    .eq("profile_id", userId)

  const existingMap = new Map<string, number>()
  for (const row of existing || []) {
    existingMap.set(`${row.product_id}:${row.variant_id ?? ""}`, row.quantity)
  }

  const rows = guestCart
    .filter((item) => item.productId && item.quantity > 0)
    .map((item) => {
      const key = `${item.productId}:${item.variantId ?? ""}`
      const prior = existingMap.get(key) || 0
      return {
        profile_id: userId,
        product_id: item.productId,
        variant_id: item.variantId || null,
        quantity: prior + item.quantity,
      }
    })

  if (rows.length > 0) {
    await supabase
      .from("cart_items")
      .upsert(rows, { onConflict: "profile_id,product_id,variant_id" })
  }

  localStorage.removeItem("lumiere_cart")
}
