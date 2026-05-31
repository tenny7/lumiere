import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils/format"
import { CartItems } from "@/components/storefront/cart-items"
import { ShoppingBag } from "lucide-react"

export default async function CartPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let cartItems: Array<{
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
  }> = []

  if (user) {
    const { data } = await supabase
      .from("cart_items")
      .select(
        "id, quantity, product:products(id, name, slug, base_price, sale_price, currency, stock_quantity, images:product_images(url, is_primary)), variant:product_variants(id, name, price_adjustment)",
      )
      .eq("profile_id", user.id)

    if (data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      cartItems = data as any
    }
  }

  const subtotal = cartItems.reduce((sum, item) => {
    const price =
      (item.product.sale_price || item.product.base_price) +
      (item.variant?.price_adjustment || 0)
    return sum + price * item.quantity
  }, 0)

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl lg:text-4xl font-light mb-10">
          Your Cart
        </h1>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              <CartItems items={cartItems} />
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
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8a8478]">Delivery</span>
                    <span className="text-[#8a8478]">
                      {subtotal >= 150 ? "Free" : formatCurrency(25)}
                    </span>
                  </div>
                  <div className="border-t border-white/5 pt-3 flex justify-between text-base font-medium">
                    <span>Total</span>
                    <span>
                      {formatCurrency(subtotal + (subtotal >= 150 ? 0 : 25))}
                    </span>
                  </div>
                </div>
                {subtotal < 150 && (
                  <p className="text-xs text-amber-400 mb-4">
                    Add {formatCurrency(150 - subtotal)} more for free delivery
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
        ) : (
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
        )}
      </div>
    </div>
  )
}
