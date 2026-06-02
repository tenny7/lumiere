"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, Heart, Check, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { notifyCartUpdated } from "@/hooks/use-cart-count"
import { notifyWishlistUpdated } from "@/hooks/use-wishlist-count"
import { toast } from "sonner"

const CART_KEY = "lumiere_cart"

/**
 * Hover-revealed quick actions on a product card: add to cart and save to
 * wishlist without leaving the listing. Sits as a sibling of the card's <Link>
 * (so it isn't nested inside an anchor) and stops propagation defensively.
 */
export function ProductCardActions({
  productId,
  className = "",
}: {
  productId: string
  className?: string
}) {
  const router = useRouter()
  const [cartLoading, setCartLoading] = useState(false)
  const [wishLoading, setWishLoading] = useState(false)
  const [inCart, setInCart] = useState(false)
  const [saved, setSaved] = useState(false)

  async function addToCart(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setCartLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      try {
        const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]")
        const existing = cart.find(
          (i: { productId: string; variantId?: string }) =>
            i.productId === productId && !i.variantId,
        )
        if (existing) existing.quantity += 1
        else cart.push({ productId, quantity: 1 })
        localStorage.setItem(CART_KEY, JSON.stringify(cart))
        notifyCartUpdated()
        setInCart(true)
        toast.success("Added to cart", {
          action: { label: "View cart", onClick: () => router.push("/cart") },
        })
      } catch {
        toast.error("Failed to add to cart")
      }
      setCartLoading(false)
      return
    }

    const { error } = await supabase.from("cart_items").upsert(
      { profile_id: user.id, product_id: productId, variant_id: null, quantity: 1 },
      { onConflict: "profile_id,product_id,variant_id" },
    )
    if (error) {
      toast.error("Failed to add to cart")
    } else {
      notifyCartUpdated()
      setInCart(true)
      toast.success("Added to cart", {
        action: { label: "View cart", onClick: () => router.push("/cart") },
      })
    }
    setCartLoading(false)
  }

  async function saveToWishlist(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setWishLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Please sign in to save items")
      router.push("/login?redirect=/products")
      setWishLoading(false)
      return
    }

    const { error } = await supabase
      .from("wishlists")
      .insert({ profile_id: user.id, product_id: productId })

    if (error && error.code !== "23505") {
      toast.error("Failed to save item")
    } else {
      setSaved(true)
      notifyWishlistUpdated()
      toast.success(error?.code === "23505" ? "Already in your wishlist" : "Saved to wishlist", {
        action: {
          label: "View wishlist",
          onClick: () => router.push("/account/wishlist"),
        },
      })
    }
    setWishLoading(false)
  }

  return (
    <div
      className={`flex flex-col gap-2 opacity-100 translate-x-0 sm:opacity-0 sm:translate-x-2 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 transition-all duration-300 ${className}`}
    >
      <button
        onClick={saveToWishlist}
        disabled={wishLoading}
        aria-label="Save to wishlist"
        className="grid place-items-center w-9 h-9 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-colors disabled:opacity-60"
      >
        {wishLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Heart className={`w-4 h-4 ${saved ? "fill-amber-400 text-amber-400" : ""}`} />
        )}
      </button>
      <button
        onClick={addToCart}
        disabled={cartLoading}
        aria-label="Add to cart"
        className="grid place-items-center w-9 h-9 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-colors disabled:opacity-60"
      >
        {cartLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : inCart ? (
          <Check className="w-4 h-4" />
        ) : (
          <ShoppingBag className="w-4 h-4" />
        )}
      </button>
    </div>
  )
}
