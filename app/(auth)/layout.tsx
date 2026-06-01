import Link from "next/link"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-[#0a0a08] text-[#f5f0e8]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center">
        <div className="absolute inset-0 bg-gradient-radial from-amber-500/[0.06] to-transparent" />
        <div className="relative text-center px-12">
          <Link
            href="/"
            className="font-serif text-4xl font-light tracking-[0.3em] mb-6 block"
          >
            AJABU <span className="text-amber-400">LIGHTING</span>
          </Link>
          <p className="text-[#8a8478] text-sm font-light leading-relaxed max-w-sm mx-auto">
            Curated lighting for spaces that deserve to shine. Sign in to manage
            your orders, wishlists, and more.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link
            href="/"
            className="lg:hidden font-serif text-2xl font-light tracking-[0.3em] mb-10 block text-center"
          >
            AJABU <span className="text-amber-400">LIGHTING</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  )
}
