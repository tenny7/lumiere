"use client"

import { useEffect, useState } from "react"
import { Sparkles, X, Heart, ShoppingBag } from "lucide-react"

const KEY = "ajabu_shop_tip_dismissed"

/** One-time, dismissible hint that teaches the quick-add icons on product cards. */
export function ShopTip() {
  const [hidden, setHidden] = useState(true)
  useEffect(() => {
    setHidden(localStorage.getItem(KEY) === "1")
  }, [])
  if (hidden) return null

  return (
    <div className="mb-6 flex items-start gap-3 border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3">
      <Sparkles className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" strokeWidth={1.5} />
      <p className="text-sm text-[#8a8478] flex-1 leading-relaxed">
        Hover any product to save it to your wishlist{" "}
        <Heart className="inline w-3.5 h-3.5 -mt-0.5 text-amber-400" /> or add it
        to your cart{" "}
        <ShoppingBag className="inline w-3.5 h-3.5 -mt-0.5 text-amber-400" />{" "}
        instantly — or click through for full details.
      </p>
      <button
        onClick={() => {
          localStorage.setItem(KEY, "1")
          setHidden(true)
        }}
        aria-label="Dismiss tip"
        className="text-[#8a8478] hover:text-warm-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
