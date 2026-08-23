"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { notifyCartUpdated } from "@/hooks/use-cart-count"
import { notifyWishlistUpdated } from "@/hooks/use-wishlist-count"
import { toast } from "sonner"
import { ShoppingBag, X, Check } from "lucide-react"

export function WishlistActions({
  wishlistId,
  productId,
  initialInCart = false,
}: {
  wishlistId: string
  productId: string
  initialInCart?: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [inCart, setInCart] = useState(initialInCart)

  async function handleRemove() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("wishlists")
      .delete()
      .eq("id", wishlistId)

    if (error) {
      toast.error("Failed to remove item")
    } else {
      notifyWishlistUpdated()
      toast.success("Removed from wishlist")
      router.refresh()
    }
    setLoading(false)
  }

  async function handleAddToCart() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Please log in to add to cart")
      setLoading(false)
      return
    }

    const { error } = await supabase.from("cart_items").upsert(
      {
        profile_id: user.id,
        product_id: productId,
        variant_id: null,
        quantity: 1,
      },
      { onConflict: "profile_id,product_id,variant_id" },
    )

    if (error) {
      toast.error("Failed to add to cart")
    } else {
      setInCart(true)
      notifyCartUpdated()
      toast.success("Added to cart", {
        action: { label: "View cart", onClick: () => router.push("/cart") },
      })
    }
    setLoading(false)
  }

  return (
    <div className="mt-3 flex gap-2">
      {inCart ? (
        <button
          onClick={() => router.push("/cart")}
          className="flex-1 py-2.5 border border-amber-500/40 text-amber-400 text-[0.7rem] font-medium tracking-[0.15em] uppercase hover:bg-amber-500/10 transition-colors flex items-center justify-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          In Cart · View
        </button>
      ) : (
        <button
          onClick={handleAddToCart}
          disabled={loading}
          className="flex-1 py-2.5 bg-amber-500 text-black text-[0.7rem] font-medium tracking-[0.15em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Add to Cart
        </button>
      )}
      <button
        onClick={handleRemove}
        disabled={loading}
        className="w-10 flex items-center justify-center border border-white/[0.06] text-[#8a8478] hover:text-rose-400 hover:border-rose-500/30 transition-colors disabled:opacity-50"
        title="Remove from wishlist"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
