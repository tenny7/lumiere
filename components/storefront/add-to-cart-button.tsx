"use client"

import { useState } from "react"
import { ShoppingBag, Minus, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { notifyCartUpdated } from "@/hooks/use-cart-count"
import { toast } from "sonner"

export function AddToCartButton({
  productId,
  variantId,
  disabled,
}: {
  productId: string
  variantId?: string
  disabled?: boolean
}) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)

  async function addToCart() {
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      // Store in localStorage for guest users
      const cart = JSON.parse(localStorage.getItem("lumiere_cart") || "[]")
      const existing = cart.find(
        (item: { productId: string; variantId?: string }) =>
          item.productId === productId && item.variantId === variantId,
      )
      if (existing) {
        existing.quantity += quantity
      } else {
        cart.push({ productId, variantId, quantity })
      }
      localStorage.setItem("lumiere_cart", JSON.stringify(cart))
      notifyCartUpdated()
      toast.success("Added to cart")
      setLoading(false)
      return
    }

    // Logged-in user — save to Supabase
    const { error } = await supabase.from("cart_items").upsert(
      {
        profile_id: user.id,
        product_id: productId,
        variant_id: variantId || null,
        quantity,
      },
      { onConflict: "profile_id,product_id,variant_id" },
    )

    if (error) {
      toast.error("Failed to add to cart")
    } else {
      notifyCartUpdated()
      toast.success("Added to cart")
    }
    setLoading(false)
  }

  return (
    <div className="flex gap-3">
      {/* Quantity */}
      <div className="flex items-center border border-white/10">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          className="w-10 h-12 flex items-center justify-center text-[#8a8478] hover:text-[#f5f0e8] transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-10 text-center text-sm">{quantity}</span>
        <button
          onClick={() => setQuantity(quantity + 1)}
          className="w-10 h-12 flex items-center justify-center text-[#8a8478] hover:text-[#f5f0e8] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Add to Cart */}
      <button
        onClick={addToCart}
        disabled={disabled || loading}
        className="flex-1 py-3 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <ShoppingBag className="w-4 h-4" />
        {loading ? "Adding..." : disabled ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  )
}
