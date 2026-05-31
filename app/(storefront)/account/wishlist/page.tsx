import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils/format"
import { ArrowLeft, ArrowRight, Heart } from "lucide-react"
import { WishlistActions } from "./wishlist-actions"

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login?redirect=/account/wishlist")
  }

  const { data: wishlistItems } = await supabase
    .from("wishlists")
    .select("id, product_id, product:products(id, name, slug, base_price, sale_price, currency, images:product_images(url, alt_text, is_primary))")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm text-[#8a8478] hover:text-[#f5f0e8] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          My Account
        </Link>

        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
          Saved Items
        </p>
        <h1 className="font-serif text-4xl font-light mb-10">
          Your Wishlist
        </h1>

        {wishlistItems && wishlistItems.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {wishlistItems.map((item) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const product = item.product as any
              if (!product) return null

              const primaryImage = product.images?.find(
                (img: { is_primary: boolean }) => img.is_primary,
              ) || product.images?.[0]

              return (
                <div key={item.id} className="group relative">
                  <Link href={`/products/${product.slug}`}>
                    <div className="aspect-[3/4] bg-[#1a1918] border border-white/[0.03] relative overflow-hidden mb-3">
                      {primaryImage ? (
                        <img
                          src={primaryImage.url}
                          alt={primaryImage.alt_text || product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-radial from-amber-500/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
                      )}
                      {product.sale_price && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 text-[0.55rem] tracking-[0.2em] uppercase font-medium bg-rose-500 text-white">
                          Sale
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-base font-normal mb-0.5">
                      {product.name}
                    </h3>
                    <p className="text-sm font-light">
                      {formatCurrency(product.sale_price || product.base_price, product.currency)}
                      {product.sale_price && (
                        <span className="text-[#8a8478] line-through ml-2 text-xs">
                          {formatCurrency(product.base_price, product.currency)}
                        </span>
                      )}
                    </p>
                  </Link>

                  <WishlistActions
                    wishlistId={item.id}
                    productId={product.id}
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 border border-white/[0.06]">
            <Heart className="w-10 h-10 text-[#8a8478]/40 mx-auto mb-4" strokeWidth={1.5} />
            <p className="text-[#8a8478] mb-4">Your wishlist is empty</p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              Browse products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
