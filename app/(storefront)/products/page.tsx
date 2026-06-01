import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils/format"
import { getStoreCurrency } from "@/lib/utils/settings"
import { ArrowRight } from "lucide-react"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string; sort?: string; page?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const storeCurrency = await getStoreCurrency()

  // Build query
  let query = supabase
    .from("products")
    .select("*, category:categories(name, slug), images:product_images(url, alt_text, is_primary)", { count: "exact" })
    .eq("is_active", true)

  if (params.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", params.category)
      .single()
    if (cat) query = query.eq("category_id", cat.id)
  }

  if (params.search) {
    query = query.textSearch("name", params.search, { type: "websearch" })
  }

  // Sort
  switch (params.sort) {
    case "price-asc":
      query = query.order("base_price", { ascending: true })
      break
    case "price-desc":
      query = query.order("base_price", { ascending: false })
      break
    case "newest":
      query = query.order("created_at", { ascending: false })
      break
    default:
      query = query.order("is_featured", { ascending: false }).order("created_at", { ascending: false })
  }

  const page = parseInt(params.page || "1")
  const perPage = 24
  query = query.range((page - 1) * perPage, page * perPage - 1)

  const { data: products, count } = await query

  // Categories for filter
  const { data: categories } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("is_active", true)
    .order("sort_order")

  const totalPages = Math.ceil((count || 0) / perPage)

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
            Our Collection
          </p>
          <h1 className="font-serif text-4xl lg:text-5xl font-light">
            {params.category
              ? categories?.find((c) => c.slug === params.category)?.name || "Products"
              : params.search
                ? `Results for "${params.search}"`
                : "All Lights"}
          </h1>
          {count !== null && (
            <p className="text-sm text-[#8a8478] mt-2">{count} products</p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar Filters */}
          <aside className="lg:w-56 flex-shrink-0">
            <h3 className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#8a8478] mb-4">
              Categories
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className={`text-sm transition-colors ${!params.category ? "text-amber-400" : "text-[#8a8478] hover:text-[#f5f0e8]"}`}
                >
                  All
                </Link>
              </li>
              {categories?.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/products?category=${cat.slug}`}
                    className={`text-sm transition-colors ${params.category === cat.slug ? "text-amber-400" : "text-[#8a8478] hover:text-[#f5f0e8]"}`}
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#8a8478] mb-4 mt-8">
              Sort By
            </h3>
            <ul className="space-y-2">
              {[
                { value: "", label: "Featured" },
                { value: "newest", label: "Newest" },
                { value: "price-asc", label: "Price: Low to High" },
                { value: "price-desc", label: "Price: High to Low" },
              ].map((opt) => (
                <li key={opt.value}>
                  <Link
                    href={`/products?${new URLSearchParams({ ...params, sort: opt.value, page: "1" }).toString()}`}
                    className={`text-sm transition-colors ${(params.sort || "") === opt.value ? "text-amber-400" : "text-[#8a8478] hover:text-[#f5f0e8]"}`}
                  >
                    {opt.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {products && products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                  {products.map((product) => {
                    const primaryImage = product.images?.find(
                      (img: { is_primary: boolean }) => img.is_primary,
                    ) || product.images?.[0]

                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        className="group"
                      >
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
                          {product.is_featured && !product.sale_price && (
                            <span className="absolute top-3 left-3 px-2.5 py-1 text-[0.55rem] tracking-[0.2em] uppercase font-medium bg-amber-500 text-black">
                              Featured
                            </span>
                          )}
                        </div>
                        <h3 className="font-serif text-base font-normal mb-0.5">
                          {product.name}
                        </h3>
                        <p className="text-[0.68rem] text-[#8a8478] tracking-[0.08em] uppercase mb-1">
                          {product.category?.name}
                        </p>
                        <p className="text-sm font-light">
                          {formatCurrency(product.sale_price || product.base_price, storeCurrency)}
                          {product.sale_price && (
                            <span className="text-[#8a8478] line-through ml-2 text-xs">
                              {formatCurrency(product.base_price, storeCurrency)}
                            </span>
                          )}
                        </p>
                      </Link>
                    )
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <Link
                          key={p}
                          href={`/products?${new URLSearchParams({ ...params, page: p.toString() }).toString()}`}
                          className={`w-10 h-10 flex items-center justify-center text-sm transition-colors ${
                            p === page
                              ? "bg-amber-500 text-black"
                              : "border border-white/10 text-[#8a8478] hover:border-amber-500/50"
                          }`}
                        >
                          {p}
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20">
                <p className="text-[#8a8478] mb-4">No products found</p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Browse all products
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
