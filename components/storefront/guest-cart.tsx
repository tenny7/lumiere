"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { notifyCartUpdated } from "@/hooks/use-cart-count"
import { formatCurrency } from "@/lib/utils/format"
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react"

const CART_KEY = "lumiere_cart"

type GuestEntry = { productId: string; variantId?: string; quantity: number }

type DisplayItem = {
  key: string
  productId: string
  variantId?: string
  quantity: number
  name: string
  slug: string
  unitPrice: number
  stock: number
  image: string | null
  variantName?: string
}

function readGuestCart(): GuestEntry[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]")
  } catch {
    return []
  }
}

function writeGuestCart(entries: GuestEntry[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(entries))
  notifyCartUpdated()
}

export function GuestCart({ currency = "RWF" }: { currency?: string }) {
  const [items, setItems] = useState<DisplayItem[]>([])
  const [loading, setLoading] = useState(true)

  const hydrate = useCallback(async () => {
    const entries = readGuestCart()
    if (entries.length === 0) {
      setItems([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    const productIds = [...new Set(entries.map((e) => e.productId))]
    const variantIds = entries
      .map((e) => e.variantId)
      .filter((v): v is string => !!v)

    const [{ data: products }, variantsRes] = await Promise.all([
      supabase
        .from("products")
        .select(
          "id, name, slug, base_price, sale_price, stock_quantity, images:product_images(url, is_primary)",
        )
        .in("id", productIds),
      variantIds.length
        ? supabase
            .from("product_variants")
            .select("id, name, price_adjustment, stock_quantity")
            .in("id", variantIds)
        : Promise.resolve({ data: [] as never[] }),
    ])

    const variants = variantsRes.data || []
    const display: DisplayItem[] = []

    for (const entry of entries) {
      const product = products?.find((p) => p.id === entry.productId)
      if (!product) continue // product no longer available — drop it
      const variant = entry.variantId
        ? variants.find((v) => v.id === entry.variantId)
        : undefined
      const img =
        product.images?.find((i: { is_primary: boolean }) => i.is_primary) ||
        product.images?.[0]
      display.push({
        key: `${entry.productId}:${entry.variantId || ""}`,
        productId: entry.productId,
        variantId: entry.variantId,
        quantity: entry.quantity,
        name: product.name,
        slug: product.slug,
        unitPrice:
          (product.sale_price || product.base_price) +
          (variant?.price_adjustment || 0),
        stock: variant?.stock_quantity ?? product.stock_quantity,
        image: img?.url ?? null,
        variantName: variant?.name,
      })
    }

    setItems(display)
    setLoading(false)
  }, [])

  useEffect(() => {
    hydrate()
  }, [hydrate])

  function updateQuantity(productId: string, variantId: string | undefined, next: number) {
    if (next < 1) return
    const entries = readGuestCart().map((e) =>
      e.productId === productId && (e.variantId || "") === (variantId || "")
        ? { ...e, quantity: next }
        : e,
    )
    writeGuestCart(entries)
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && (i.variantId || "") === (variantId || "")
          ? { ...i, quantity: next }
          : i,
      ),
    )
  }

  function removeItem(productId: string, variantId: string | undefined) {
    const entries = readGuestCart().filter(
      (e) => !(e.productId === productId && (e.variantId || "") === (variantId || "")),
    )
    writeGuestCart(entries)
    setItems((prev) =>
      prev.filter(
        (i) => !(i.productId === productId && (i.variantId || "") === (variantId || "")),
      ),
    )
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0)
  const delivery = subtotal >= 150 ? 0 : 25

  if (loading) {
    return (
      <div className="text-center py-20 text-[#8a8478]">Loading your cart…</div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingBag className="w-12 h-12 text-[#242320] mx-auto mb-4" />
        <p className="text-[#8a8478] mb-6">Your cart is empty</p>
        <Link
          href="/products"
          className="inline-block px-8 py-3 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2 space-y-4">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex gap-4 border border-white/[0.06] p-4"
          >
            <div className="w-20 h-20 bg-[#1a1918] flex-shrink-0 overflow-hidden">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#242320] to-[#1a1918]" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <Link
                href={`/products/${item.slug}`}
                className="font-serif text-sm hover:text-amber-400 transition-colors"
              >
                {item.name}
              </Link>
              {item.variantName && (
                <p className="text-xs text-[#8a8478]">{item.variantName}</p>
              )}
              <p className="text-sm mt-1">
                {formatCurrency(item.unitPrice, currency)}
              </p>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center border border-white/10">
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.variantId, item.quantity - 1)
                    }
                    aria-label="Decrease quantity"
                    className="w-8 h-8 flex items-center justify-center text-[#8a8478] hover:text-[#f5f0e8] transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-9 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() =>
                      updateQuantity(item.productId, item.variantId, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.stock}
                    aria-label="Increase quantity"
                    className="w-8 h-8 flex items-center justify-center text-[#8a8478] hover:text-[#f5f0e8] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  aria-label="Remove item"
                  className="text-[#8a8478] hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="text-sm font-medium text-right flex-shrink-0">
              {formatCurrency(item.unitPrice * item.quantity, currency)}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="lg:col-span-1">
        <div className="bg-[#1a1918] border border-white/[0.03] p-6">
          <h3 className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-6">
            Order Summary
          </h3>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-[#8a8478]">Subtotal</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#8a8478]">Delivery</span>
              <span className="text-[#8a8478]">
                {delivery === 0 ? "Free" : formatCurrency(delivery, currency)}
              </span>
            </div>
            <div className="border-t border-white/5 pt-3 flex justify-between text-base font-medium">
              <span>Total</span>
              <span>{formatCurrency(subtotal + delivery, currency)}</span>
            </div>
          </div>
          {subtotal < 150 && (
            <p className="text-xs text-amber-400 mb-4">
              Add {formatCurrency(150 - subtotal, currency)} more for free delivery
            </p>
          )}
          <Link
            href="/checkout"
            className="block w-full py-3 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase text-center hover:bg-amber-400 transition-colors"
          >
            Proceed to Checkout
          </Link>
          <Link
            href="/products"
            className="block text-center text-sm text-[#8a8478] hover:text-[#f5f0e8] transition-colors mt-4"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
