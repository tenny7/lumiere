"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, Minus, Plus, Heart } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { notifyCartUpdated } from "@/hooks/use-cart-count"
import { formatCurrency } from "@/lib/utils/format"
import { toast } from "sonner"

interface Variant {
  id: string
  name: string
  price_adjustment: number
  stock_quantity: number
}

export function ProductInteractions({
  productId,
  basePrice,
  salePrice,
  currency,
  baseStock,
  variants,
  initialWishlisted,
}: {
  productId: string
  basePrice: number
  salePrice: number | null
  currency: string
  baseStock: number
  variants: Variant[]
  initialWishlisted: boolean
}) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [wishLoading, setWishLoading] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(
    variants.length > 0 ? variants[0] : null,
  )

  const unitPrice =
    (salePrice || basePrice) + (selectedVariant?.price_adjustment || 0)
  const stock = selectedVariant ? selectedVariant.stock_quantity : baseStock
  const outOfStock = stock <= 0

  async function addToCart() {
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const cart = JSON.parse(localStorage.getItem("lumiere_cart") || "[]")
      const existing = cart.find(
        (item: { productId: string; variantId?: string }) =>
          item.productId === productId &&
          item.variantId === selectedVariant?.id,
      )
      if (existing) {
        existing.quantity += quantity
      } else {
        cart.push({ productId, variantId: selectedVariant?.id, quantity })
      }
      localStorage.setItem("lumiere_cart", JSON.stringify(cart))
      notifyCartUpdated()
      toast.success("Added to cart")
      setLoading(false)
      return
    }

    const { error } = await supabase.from("cart_items").upsert(
      {
        profile_id: user.id,
        product_id: productId,
        variant_id: selectedVariant?.id || null,
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

  async function toggleWishlist() {
    setWishLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Please sign in to save items")
      router.push(`/login?redirect=/products`)
      setWishLoading(false)
      return
    }

    if (wishlisted) {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("profile_id", user.id)
        .eq("product_id", productId)
      if (error) {
        toast.error("Failed to update wishlist")
      } else {
        setWishlisted(false)
        toast.success("Removed from wishlist")
      }
    } else {
      const { error } = await supabase
        .from("wishlists")
        .insert({ profile_id: user.id, product_id: productId })
      if (error) {
        toast.error("Failed to update wishlist")
      } else {
        setWishlisted(true)
        toast.success("Saved to wishlist")
      }
    }
    setWishLoading(false)
  }

  return (
    <div>
      {/* Variants */}
      {variants.length > 0 && (
        <div className="mb-8">
          <p className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-3">
            Options
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => {
                  setSelectedVariant(variant)
                  setQuantity(1)
                }}
                className={`px-4 py-2 border text-sm transition-colors ${
                  selectedVariant?.id === variant.id
                    ? "border-amber-500 text-amber-400"
                    : "border-white/10 hover:border-amber-500/50"
                }`}
              >
                {variant.name}
                {variant.price_adjustment !== 0 && (
                  <span className="ml-1.5 text-[#8a8478]">
                    {variant.price_adjustment > 0 ? "+" : ""}
                    {formatCurrency(variant.price_adjustment, currency)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected price (varies with variant) */}
      {variants.length > 0 && (
        <p className="text-sm text-[#8a8478] mb-4">
          Selected: {formatCurrency(unitPrice, currency)}
        </p>
      )}

      {/* Add to Cart + Wishlist */}
      <div className="flex gap-3">
        <div className="flex items-center border border-white/10">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-12 flex items-center justify-center text-[#8a8478] hover:text-[#f5f0e8] transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-10 text-center text-sm">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
            disabled={quantity >= stock}
            className="w-10 h-12 flex items-center justify-center text-[#8a8478] hover:text-[#f5f0e8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={addToCart}
          disabled={outOfStock || loading}
          className="flex-1 py-3 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          {loading ? "Adding..." : outOfStock ? "Out of Stock" : "Add to Cart"}
        </button>

        <button
          onClick={toggleWishlist}
          disabled={wishLoading}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="w-12 h-12 flex items-center justify-center border border-white/10 hover:border-amber-500/50 transition-colors disabled:opacity-50"
        >
          <Heart
            className={`w-4 h-4 ${wishlisted ? "fill-amber-400 text-amber-400" : "text-[#8a8478]"}`}
          />
        </button>
      </div>
    </div>
  )
}
