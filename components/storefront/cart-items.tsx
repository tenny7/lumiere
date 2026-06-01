"use client"

import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { notifyCartUpdated } from "@/hooks/use-cart-count"
import { formatCurrency } from "@/lib/utils/format"
import { Minus, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface CartItemData {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    base_price: number
    sale_price: number | null
    currency: string
    stock_quantity: number
    images: Array<{ url: string; is_primary: boolean }>
  }
  variant: { id: string; name: string; price_adjustment: number } | null
}

export function CartItems({
  items,
  currency = "RWF",
}: {
  items: CartItemData[]
  currency?: string
}) {
  const router = useRouter()
  const supabase = createClient()

  async function updateQuantity(id: string, quantity: number, maxStock: number) {
    if (quantity < 1) return
    if (quantity > maxStock) {
      toast.error(`Only ${maxStock} available in stock`)
      return
    }
    await supabase.from("cart_items").update({ quantity }).eq("id", id)
    notifyCartUpdated()
    router.refresh()
  }

  async function removeItem(id: string) {
    await supabase.from("cart_items").delete().eq("id", id)
    notifyCartUpdated()
    toast.success("Item removed")
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {items.map((item) => {
        const price =
          (item.product.sale_price || item.product.base_price) +
          (item.variant?.price_adjustment || 0)
        const primaryImage =
          item.product.images?.find((img) => img.is_primary) ||
          item.product.images?.[0]

        return (
          <div
            key={item.id}
            className="flex gap-4 pb-6 border-b border-white/5"
          >
            {/* Image */}
            <div className="w-20 h-24 bg-[#1a1918] border border-white/[0.03] flex-shrink-0 overflow-hidden">
              {primaryImage ? (
                <img
                  src={primaryImage.url}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-radial from-amber-500/10 to-transparent" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-serif text-sm mb-0.5 truncate">
                {item.product.name}
              </h3>
              {item.variant && (
                <p className="text-xs text-[#8a8478]">{item.variant.name}</p>
              )}
              <p className="text-sm mt-1">
                {formatCurrency(price, currency)}
              </p>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center border border-white/10">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.quantity - 1, item.product.stock_quantity)
                    }
                    className="w-8 h-8 flex items-center justify-center text-[#8a8478] hover:text-[#f5f0e8] transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-8 text-center text-xs">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1, item.product.stock_quantity)
                    }
                    disabled={item.quantity >= item.product.stock_quantity}
                    className="w-8 h-8 flex items-center justify-center text-[#8a8478] hover:text-[#f5f0e8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-[#8a8478] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Line total */}
            <div className="text-sm font-medium text-right flex-shrink-0">
              {formatCurrency(price * item.quantity, currency)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
