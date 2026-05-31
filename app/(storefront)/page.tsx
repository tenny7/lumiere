import Link from "next/link"
import { ArrowRight, Truck, Shield, RotateCcw, Headphones } from "lucide-react"
import { NewsletterForm } from "@/components/storefront/newsletter-form"

const categories = [
  { name: "Chandeliers", slug: "chandeliers", count: 124, accent: "from-amber-900/20 to-transparent" },
  { name: "Pendant Lights", slug: "pendant-lights", count: 156, accent: "from-rose-900/20 to-transparent" },
  { name: "Table Lamps", slug: "table-lamps", count: 89, accent: "from-sky-900/20 to-transparent" },
  { name: "Smart Lights", slug: "smart-lights", count: 98, accent: "from-violet-900/20 to-transparent" },
  { name: "Outdoor Lighting", slug: "outdoor-lighting", count: 73, accent: "from-emerald-900/20 to-transparent" },
  { name: "LED Strips", slug: "led-strips", count: 67, accent: "from-orange-900/20 to-transparent" },
]

const featuredProducts = [
  { name: "Aurelia Globe", type: "Pendant Light", price: 420, tag: "New", slug: "aurelia-globe" },
  { name: "Silhouette Desk", type: "Table Lamp", price: 285, slug: "silhouette-desk" },
  { name: "Cascade Trio", type: "Cluster Pendant", price: 560, originalPrice: 800, tag: "Sale", slug: "cascade-trio" },
  { name: "Halo Column", type: "Smart Floor Lamp", price: 395, tag: "Smart", slug: "halo-column" },
]

const services = [
  { icon: Shield, title: "5-Year Warranty", desc: "Every fixture protected against defects" },
  { icon: Truck, title: "Free Delivery", desc: "On all orders over RWF 50,000" },
  { icon: RotateCcw, title: "Easy Returns", desc: "90 days to decide, free return shipping" },
  { icon: Headphones, title: "Expert Support", desc: "Real designers, available 7 days a week" },
]

export default function HomePage() {
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
          <p className="text-[0.7rem] font-medium tracking-[0.4em] uppercase text-amber-400 mb-8 animate-fade-in">
            Spring Collection 2026
          </p>
          <h1 className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light leading-[0.95] tracking-tight mb-8">
            Light That
            <br />
            <em className="italic text-amber-400">Lives</em>
          </h1>
          <p className="text-base font-extralight text-[#8a8478] max-w-md mx-auto mb-10 leading-relaxed">
            Handpicked fixtures that transform your space from simply lit to
            truly luminous.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="px-8 py-3.5 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors"
            >
              Explore Collection
            </Link>
            <Link
              href="/about"
              className="px-8 py-3.5 border border-white/10 text-[0.72rem] font-light tracking-[0.2em] uppercase hover:border-amber-500/50 hover:bg-amber-500/5 transition-all"
            >
              Our Story
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ MARQUEE ═══ */}
      <div className="py-3.5 border-y border-white/5 overflow-hidden">
        <div className="flex gap-12 animate-marquee whitespace-nowrap">
          {[
            "Free Shipping Over RWF 50,000",
            "Handcrafted Artisan Fixtures",
            "Smart Home Compatible",
            "5-Year Warranty",
            "Expert Lighting Consultation",
            "Carbon-Neutral Delivery",
            "Free Shipping Over RWF 50,000",
            "Handcrafted Artisan Fixtures",
            "Smart Home Compatible",
            "5-Year Warranty",
            "Expert Lighting Consultation",
            "Carbon-Neutral Delivery",
          ].map((text, i) => (
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

      {/* ═══ CATEGORIES ═══ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex justify-between items-end mb-12">
          <div>
            <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
              Shop by Category
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light">
              Find Your Light
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-2 text-[0.72rem] tracking-[0.15em] uppercase text-[#8a8478] hover:text-amber-400 transition-colors group"
          >
            All Categories
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categories/${cat.slug}`}
              className="group relative h-52 lg:h-64 bg-[#1a1918] border border-white/[0.03] overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-radial ${cat.accent} opacity-60 group-hover:opacity-100 transition-opacity duration-500`}
              />
              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#0a0a08]/90 to-transparent">
                <h3 className="font-serif text-lg font-normal mb-0.5">
                  {cat.name}
                </h3>
                <span className="text-[0.68rem] tracking-[0.15em] text-[#8a8478] uppercase">
                  {cat.count} pieces
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
            <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
              Editor&apos;s Picks
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light">
              Curated for You
            </h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-2 text-[0.72rem] tracking-[0.15em] uppercase text-[#8a8478] hover:text-amber-400 transition-colors group"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {featuredProducts.map((product) => (
            <Link
              key={product.slug}
              href={`/products/${product.slug}`}
              className="group"
            >
              <div className="aspect-[3/4] bg-[#1a1918] border border-white/[0.03] relative overflow-hidden mb-4">
                <div className="absolute inset-0 bg-gradient-radial from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                {product.tag && (
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 text-[0.55rem] tracking-[0.2em] uppercase font-medium ${
                      product.tag === "Sale"
                        ? "bg-rose-500 text-white"
                        : product.tag === "Smart"
                          ? "bg-white/10 text-sky-300 border border-sky-300/20"
                          : "bg-amber-500 text-black"
                    }`}
                  >
                    {product.tag === "Sale" ? "-30%" : product.tag}
                  </span>
                )}
              </div>
              <h3 className="font-serif text-base font-normal mb-1">
                {product.name}
              </h3>
              <p className="text-[0.68rem] text-[#8a8478] tracking-[0.08em] uppercase mb-1.5">
                {product.type}
              </p>
              <p className="text-sm font-light">
                RWF {product.price}
                {product.originalPrice && (
                  <span className="text-[#8a8478] line-through ml-2 text-xs">
                    RWF {product.originalPrice}
                  </span>
                )}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ TESTIMONIAL ═══ */}
      <section className="py-16 lg:py-24 border-y border-white/5 text-center px-4">
        <blockquote className="max-w-3xl mx-auto">
          <span className="block font-serif text-4xl text-amber-400 mb-4">
            &ldquo;
          </span>
          <p className="font-serif text-xl sm:text-2xl lg:text-3xl font-light italic leading-relaxed text-[#e8e0d0] mb-8">
            The Cascade Trio completely transformed our dining room. It&apos;s
            not just a light — it&apos;s the centerpiece of every dinner party
            now.
          </p>
          <cite className="text-[0.72rem] tracking-[0.2em] uppercase text-[#8a8478] not-italic">
            <strong className="text-[#f5f0e8] font-medium">Sarah Chen</strong>{" "}
            — Interior Designer, Kigali
          </cite>
        </blockquote>
      </section>

      {/* ═══ SERVICES ═══ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 border-b border-white/5">
        {services.map((service) => (
          <div
            key={service.title}
            className="p-6 lg:p-8 text-center border-r border-white/5 last:border-r-0 hover:bg-[#1a1918] transition-colors"
          >
            <service.icon
              className="w-6 h-6 mx-auto mb-4 text-amber-400"
              strokeWidth={1.2}
            />
            <h4 className="font-serif text-sm mb-1.5">{service.title}</h4>
            <p className="text-[0.7rem] text-[#8a8478] leading-relaxed">
              {service.desc}
            </p>
          </div>
        ))}
      </section>

      {/* ═══ NEWSLETTER ═══ */}
      <section className="py-16 lg:py-24 text-center px-4 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-gradient-radial from-amber-500/[0.04] to-transparent pointer-events-none" />
        <h2 className="font-serif text-2xl sm:text-3xl font-light mb-3 relative">
          Stay in the Light
        </h2>
        <p className="text-sm font-extralight text-[#8a8478] mb-8 relative">
          New arrivals, design inspiration, and exclusive offers — delivered
          weekly.
        </p>
        <div className="relative">
          <NewsletterForm />
        </div>
      </section>
    </>
  )
}
