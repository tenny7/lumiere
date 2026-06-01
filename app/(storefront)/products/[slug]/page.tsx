import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils/format"
import { getStockLabel } from "@/lib/utils/format"
import { getStoreCurrency } from "@/lib/utils/settings"
import { Star, ChevronRight } from "lucide-react"
import { ProductInteractions } from "@/components/storefront/product-interactions"
import { ProductReviews } from "@/components/storefront/product-reviews"

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const storeCurrency = await getStoreCurrency()

  const { data: product } = await supabase
    .from("products")
    .select(
      "*, category:categories(name, slug), images:product_images(*), variants:product_variants(*), reviews(*)",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .single()

  if (!product) notFound()

  // Current user + wishlist state for this product
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialWishlisted = false
  if (user) {
    const { data: wish } = await supabase
      .from("wishlists")
      .select("id")
      .eq("profile_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle()
    initialWishlisted = !!wish
  }

  const approvedReviews = (product.reviews || []).filter(
    (r: { is_approved?: boolean }) => r.is_approved !== false,
  )

  const primaryImage =
    product.images?.find((img: { is_primary: boolean }) => img.is_primary) ||
    product.images?.[0]
  const stock = getStockLabel(product.stock_quantity, product.low_stock_threshold)
  const price = product.sale_price || product.base_price
  const avgRating =
    product.reviews && product.reviews.length > 0
      ? product.reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / product.reviews.length
      : 0

  // Specs from metadata
  const specs = product.metadata
    ? Object.entries(product.metadata as Record<string, string | number>).filter(
        ([, v]) => v !== null && v !== "",
      )
    : []

  // Related products
  const { data: related } = await supabase
    .from("products")
    .select("id, name, slug, base_price, sale_price, currency, images:product_images(url, is_primary)")
    .eq("is_active", true)
    .eq("category_id", product.category_id)
    .neq("id", product.id)
    .limit(4)

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-[#8a8478] mb-8">
          <Link href="/" className="hover:text-[#f5f0e8] transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link
            href="/products"
            className="hover:text-[#f5f0e8] transition-colors"
          >
            Shop
          </Link>
          {product.category && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link
                href={`/products?category=${product.category.slug}`}
                className="hover:text-[#f5f0e8] transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#f5f0e8]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Images */}
          <div>
            <div className="aspect-square bg-[#1a1918] border border-white/[0.03] relative overflow-hidden mb-3">
              {primaryImage ? (
                <img
                  src={primaryImage.url}
                  alt={primaryImage.alt_text || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-radial from-amber-500/10 to-transparent" />
              )}
              {product.sale_price && (
                <span className="absolute top-4 left-4 px-3 py-1.5 text-[0.6rem] tracking-[0.2em] uppercase font-medium bg-rose-500 text-white">
                  -{Math.round(((product.base_price - product.sale_price) / product.base_price) * 100)}%
                </span>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(0, 4).map((img: { id: string; url: string; alt_text: string | null }) => (
                  <div
                    key={img.id}
                    className="aspect-square bg-[#1a1918] border border-white/[0.03] overflow-hidden"
                  >
                    <img
                      src={img.url}
                      alt={img.alt_text || ""}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.category && (
              <p className="text-[0.68rem] tracking-[0.15em] uppercase text-amber-400 mb-2">
                {product.category.name}
              </p>
            )}
            <h1 className="font-serif text-3xl lg:text-4xl font-light mb-4">
              {product.name}
            </h1>

            {/* Rating */}
            {avgRating > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-[#242320]"}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#8a8478]">
                  ({product.reviews?.length} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className="mb-6">
              <span className="text-2xl font-light">
                {formatCurrency(price, storeCurrency)}
              </span>
              {product.sale_price && (
                <span className="text-lg text-[#8a8478] line-through ml-3">
                  {formatCurrency(product.base_price, storeCurrency)}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="mb-6">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  stock.variant === "success"
                    ? "bg-green-500/10 text-green-400"
                    : stock.variant === "warning"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-red-500/10 text-red-400"
                }`}
              >
                {stock.label}
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-sm text-[#8a8478] leading-relaxed mb-8">
                {product.description}
              </p>
            )}

            {/* Variants + Add to Cart + Wishlist */}
            <ProductInteractions
              productId={product.id}
              basePrice={product.base_price}
              salePrice={product.sale_price}
              currency={storeCurrency}
              baseStock={product.stock_quantity}
              variants={product.variants || []}
              initialWishlisted={initialWishlisted}
            />

            {/* Specs */}
            {specs.length > 0 && (
              <div className="mt-10 border-t border-white/5 pt-8">
                <h3 className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-4">
                  Specifications
                </h3>
                <dl className="grid grid-cols-2 gap-3">
                  {specs.map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs text-[#8a8478] capitalize">
                        {key.replace(/_/g, " ")}
                      </dt>
                      <dd className="text-sm">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {product.sku && (
              <p className="text-xs text-[#8a8478]/50 mt-6">SKU: {product.sku}</p>
            )}
          </div>
        </div>

        {/* Reviews */}
        <ProductReviews productId={product.id} reviews={approvedReviews} />

        {/* Related Products */}
        {related && related.length > 0 && (
          <section className="mt-20">
            <h2 className="font-serif text-2xl font-light mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {related.map((item) => {
                const img = item.images?.find(
                  (i: { is_primary: boolean }) => i.is_primary,
                ) || item.images?.[0]
                return (
                  <Link
                    key={item.id}
                    href={`/products/${item.slug}`}
                    className="group"
                  >
                    <div className="aspect-[3/4] bg-[#1a1918] border border-white/[0.03] relative overflow-hidden mb-3">
                      {img ? (
                        <img
                          src={img.url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-radial from-amber-500/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                    <h3 className="font-serif text-sm font-normal mb-1">
                      {item.name}
                    </h3>
                    <p className="text-sm font-light">
                      {formatCurrency(item.sale_price || item.base_price, storeCurrency)}
                    </p>
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
