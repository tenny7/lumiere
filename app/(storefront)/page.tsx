import Link from "next/link"
import { ArrowRight, Lightbulb, Star } from "lucide-react"
import { NewsletterForm } from "@/components/storefront/newsletter-form"
import { getContent } from "@/lib/content/server"
import { getTestimonials, type Testimonial } from "@/lib/content/testimonials"
import { CONTENT_ICONS } from "@/lib/content/icons"
import { createClient } from "@/lib/supabase/server"
import { getStoreCurrency } from "@/lib/utils/settings"
import { formatCurrency } from "@/lib/utils/format"

// Fallback gradient accents for category cards that don't have a photo yet
// (cycled by index so the grid stays visually varied).
const CATEGORY_ACCENTS = [
  "from-amber-900/20 to-transparent",
  "from-rose-900/20 to-transparent",
  "from-sky-900/20 to-transparent",
  "from-violet-900/20 to-transparent",
  "from-emerald-900/20 to-transparent",
  "from-orange-900/20 to-transparent",
]

type ShopCategory = {
  id: string
  name: string
  slug: string
  image_url: string | null
  count: number
}

// Store promises: two per row on phones, all in one row from lg (max 4).
const PROMISE_COLS: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
}

type FeaturedProduct = {
  id: string
  name: string
  slug: string
  base_price: number
  sale_price: number | null
  category: { name: string } | null
  images: Array<{ url: string; is_primary: boolean }>
}

export default async function HomePage() {
  const supabase = await createClient()
  // Text: Admin → Content (Home page, Store promises, Testimonials, Newsletter).
  const [storeCurrency, home, promises, testimonialSettings, newsletter] =
    await Promise.all([
      getStoreCurrency(),
      getContent("home"),
      getContent("promises"),
      getContent("testimonials"),
      getContent("newsletter"),
    ])
  // Only approved reviews (lib/content/testimonials.ts).
  const testimonials = testimonialSettings.show
    ? await getTestimonials(testimonialSettings)
    : []

  // Real featured products (fall back to newest active products)
  let { data: featuredProducts } = await supabase
    .from("products")
    .select(
      "id, name, slug, base_price, sale_price, category:categories(name), images:product_images(url, is_primary)",
    )
    .eq("is_active", true)
    .eq("is_featured", true)
    .limit(4)

  if (!featuredProducts || featuredProducts.length === 0) {
    const { data } = await supabase
      .from("products")
      .select(
        "id, name, slug, base_price, sale_price, category:categories(name), images:product_images(url, is_primary)",
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(4)
    featuredProducts = data
  }

  const featured = (featuredProducts || []) as unknown as FeaturedProduct[]

  // "Shop by Category" — real categories from the DB (with their image_url),
  // showing only those that have active products, top 6 by sort order.
  const { data: dbCategories } = await supabase
    .from("categories")
    .select("id, name, slug, image_url, sort_order")
    .eq("is_active", true)
    .order("sort_order")
  const { data: activeProducts } = await supabase
    .from("products")
    .select("category_id")
    .eq("is_active", true)
  const categoryCounts = new Map<string, number>()
  for (const p of activeProducts || []) {
    if (p.category_id) {
      categoryCounts.set(p.category_id, (categoryCounts.get(p.category_id) || 0) + 1)
    }
  }
  const shopCategories: ShopCategory[] = (dbCategories || [])
    .map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      image_url: c.image_url,
      count: categoryCounts.get(c.id) || 0,
    }))
    .filter((c) => c.count > 0)
    .slice(0, 6)

  return (
    <>
      {/* ═══ HERO ═══ */}
      <section className="min-h-screen flex flex-col justify-center items-center relative overflow-hidden px-4">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] left-[20%] w-[300px] h-[300px] bg-amber-500/[0.07] rounded-full blur-[80px] animate-pulse" />
          <div className="absolute top-[60%] right-[15%] w-[200px] h-[200px] bg-sky-400/[0.05] rounded-full blur-[80px] animate-pulse [animation-delay:2s]" />
          <div className="absolute bottom-[10%] left-[40%] w-[250px] h-[250px] bg-rose-400/[0.04] rounded-full blur-[80px] animate-pulse [animation-delay:4s]" />
        </div>

        <div className="text-center relative z-10">
          {home.eyebrow && (
            <p className="text-[0.7rem] font-medium tracking-[0.4em] uppercase text-amber-400 mb-8 animate-fade-in">
              {home.eyebrow}
            </p>
          )}
          <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light leading-[0.95] tracking-tight mb-8">
            {home.titleLine1}
            {home.titleLine1 && home.titleHighlight && <br />}
            {home.titleHighlight && (
              <em className="italic text-amber-400">{home.titleHighlight}</em>
            )}
          </h1>
          {home.subtitle && (
            <p className="text-base font-extralight text-[#8a8478] max-w-md mx-auto mb-10 leading-relaxed">
              {home.subtitle}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="px-8 py-3.5 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors"
            >
              {home.primaryButton || "Explore Collection"}
            </Link>
            <Link
              href="/about"
              className="px-8 py-3.5 border border-white/10 text-[0.72rem] font-light tracking-[0.2em] uppercase hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
            >
              {home.secondaryButton || "Our Story"}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      {home.marquee.length > 0 && (
      <div className="py-3.5 border-y border-white/5 overflow-hidden">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {/* Listed twice so the scroll loops seamlessly. */}
          {[...home.marquee, ...home.marquee].map((text, i) => (
            <span
              key={i}
              className="text-[0.65rem] tracking-[0.25em] uppercase text-[#8a8478] flex items-center gap-12"
            >
              {text}
              <span className="text-amber-500 text-[0.5rem]">&#10022;</span>
            </span>
          ))}
        </div>
      </div>
      )}

      {/* ═══ CATEGORIES ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex justify-between items-end mb-12">
          <div>
            {home.categoriesEyebrow && (
              <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
                {home.categoriesEyebrow}
              </p>
            )}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light">
              {home.categoriesTitle}
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-2 text-[0.72rem] tracking-[0.15em] uppercase text-[#8a8478] hover:text-amber-400 transition-colors group"
          >
            {home.categoriesLink || "All Categories"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shopCategories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="group relative h-52 lg:h-64 bg-[#1a1918] border border-white/[0.03] overflow-hidden"
            >
              {cat.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.image_url}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                />
              ) : (
                // Branded fallback until a photo is set in Admin → Categories.
                <>
                  <div
                    className={`absolute inset-0 bg-gradient-radial ${CATEGORY_ACCENTS[i % CATEGORY_ACCENTS.length]} opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lightbulb className="w-9 h-9 text-white/10" strokeWidth={1} />
                  </div>
                </>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0a08]/90 to-transparent">
                <h3 className="font-serif text-lg font-normal mb-0.5">
                  {cat.name}
                </h3>
                <span className="text-[0.68rem] tracking-[0.15em] text-[#8a8478] uppercase">
                  {cat.count} {cat.count === 1 ? "piece" : "pieces"}
                </span>
              </div>
              <div className="absolute top-4 right-4 w-9 h-9 border border-white/10 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                <ArrowRight className="w-3.5 h-3.5 -rotate-45" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ FEATURED PRODUCTS ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 lg:pb-28">
        <div className="flex justify-between items-end mb-12">
          <div>
            {home.featuredEyebrow && (
              <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
                {home.featuredEyebrow}
              </p>
            )}
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light">
              {home.featuredTitle}
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-2 text-[0.72rem] tracking-[0.15em] uppercase text-[#8a8478] hover:text-amber-400 transition-colors group"
          >
            {home.featuredLink || "View All"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {featured.map((product) => {
            const img =
              product.images?.find((i) => i.is_primary) || product.images?.[0]
            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group"
              >
                <div className="aspect-[3/4] bg-[#1a1918] border border-white/[0.03] relative overflow-hidden mb-4">
                  <div className="absolute inset-0 bg-gradient-radial from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img.url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    // Default placeholder when a featured product has no image.
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-radial from-amber-500/10 to-transparent">
                      <Lightbulb
                        className="w-10 h-10 text-amber-500/40"
                        strokeWidth={1.25}
                      />
                    </div>
                  )}
                  {product.sale_price && (
                    <span className="absolute top-3 left-3 z-20 px-2.5 py-1 text-[0.55rem] tracking-[0.2em] uppercase font-medium bg-rose-500 text-white">
                      Sale
                    </span>
                  )}
                </div>
                <h3 className="font-serif text-base font-normal mb-1">
                  {product.name}
                </h3>
                <p className="text-[0.68rem] text-[#8a8478] tracking-[0.08em] uppercase mb-1.5">
                  {product.category?.name || "Lighting"}
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
      </section>

      {/* ═══ TESTIMONIALS (approved reviews) ═══ */}
      {testimonials.length > 0 && (
        <section className="py-16 lg:py-24 border-y border-white/5 px-4">
          {testimonialSettings.heading && (
            <p className="text-center text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-10">
              {testimonialSettings.heading}
            </p>
          )}
          {testimonials.length === 1 ? (
            <TestimonialQuote t={testimonials[0]} />
          ) : (
            <div
              className={`max-w-6xl mx-auto grid gap-6 md:grid-cols-2 ${testimonials.length >= 3 ? "lg:grid-cols-3" : ""}`}
            >
              {testimonials.map((t) => (
                <TestimonialCard key={t.id} t={t} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══ STORE PROMISES ═══ */}
      {promises.items.length > 0 && (
        <section
          className={`grid grid-cols-2 ${PROMISE_COLS[promises.items.length] ?? "lg:grid-cols-4"} border-b border-white/5`}
        >
          {promises.items.map((item, i) => {
            const Icon = CONTENT_ICONS[item.icon as keyof typeof CONTENT_ICONS]?.Icon ?? Lightbulb
            return (
              <div
                key={i}
                className="p-6 lg:p-8 text-center border-r border-white/5 last:border-r-0 hover:bg-[#1a1918] transition-colors"
              >
                <Icon className="w-6 h-6 mx-auto mb-4 text-amber-400" strokeWidth={1.2} />
                <h4 className="font-serif text-sm mb-1.5">{item.title}</h4>
                <p className="text-[0.7rem] text-[#8a8478] leading-relaxed">{item.text}</p>
              </div>
            )
          })}
        </section>
      )}

      {/* ═══ NEWSLETTER ═══ */}
      <section className="py-16 lg:py-24 text-center px-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-gradient-radial from-amber-500/[0.04] to-transparent pointer-events-none" />
        {newsletter.title && (
          <h2 className="font-serif text-2xl sm:text-3xl font-light mb-3 relative">
            {newsletter.title}
          </h2>
        )}
        {newsletter.subtitle && (
          <p className="text-sm font-extralight text-[#8a8478] mb-8 relative">
            {newsletter.subtitle}
          </p>
        )}
        <div className="relative">
          <NewsletterForm
            buttonLabel={newsletter.buttonLabel || "Subscribe"}
            successMessage={newsletter.successMessage}
          />
        </div>
      </section>
    </>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex justify-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className={`h-3.5 w-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-white/15"}`}
        />
      ))}
    </div>
  )
}

function Attribution({ t }: { t: Testimonial }) {
  return (
    <cite className="text-[0.72rem] tracking-[0.2em] uppercase text-[#8a8478] not-italic">
      <strong className="text-[#f5f0e8] font-medium">{t.author}</strong>
      {t.productName && (
        <>
          {" — "}
          {t.productSlug ? (
            <Link href={`/products/${t.productSlug}`} className="hover:text-amber-400">
              {t.productName}
            </Link>
          ) : (
            t.productName
          )}
        </>
      )}
    </cite>
  )
}

/** One testimonial: the large centred quote. */
function TestimonialQuote({ t }: { t: Testimonial }) {
  return (
    <blockquote className="max-w-3xl mx-auto text-center">
      <span className="block font-serif text-4xl text-amber-400 mb-4">&ldquo;</span>
      <p className="font-serif text-xl sm:text-2xl lg:text-3xl font-light italic leading-relaxed text-[#e8e0d0] mb-6 whitespace-pre-line">
        {t.body}
      </p>
      <div className="mb-4">
        <Stars rating={t.rating} />
      </div>
      <Attribution t={t} />
    </blockquote>
  )
}

/** Several testimonials: one card each. */
function TestimonialCard({ t }: { t: Testimonial }) {
  return (
    <blockquote className="border border-white/[0.06] p-6 lg:p-8 flex flex-col text-center">
      <span className="block font-serif text-3xl text-amber-400 mb-2">&ldquo;</span>
      <p className="font-serif text-lg font-light italic leading-relaxed text-[#e8e0d0] mb-6 flex-1 whitespace-pre-line line-clamp-[8]">
        {t.body}
      </p>
      <div className="mb-3">
        <Stars rating={t.rating} />
      </div>
      <Attribution t={t} />
    </blockquote>
  )
}
