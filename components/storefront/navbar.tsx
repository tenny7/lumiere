"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Search, User, ShoppingBag, Menu, X, LayoutDashboard } from "lucide-react"
import { useCartCount } from "@/hooks/use-cart-count"
import { createClient } from "@/lib/supabase/client"

const navLinks = [
  { href: "/products", label: "Shop All" },
  { href: "/categories/chandeliers", label: "Chandeliers" },
  { href: "/categories/pendant-lights", label: "Pendants" },
  { href: "/categories/smart-lights", label: "Smart Lights" },
  { href: "/categories/outdoor-lighting", label: "Outdoor" },
]

export function Navbar() {
  const router = useRouter()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [isStaff, setIsStaff] = useState(false)
  const cartCount = useCartCount()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Show an Admin link for staff/admin users
  useEffect(() => {
    const supabase = createClient()
    async function checkRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
      setIsStaff(!!profile && profile.role !== "customer")
    }
    checkRole()
  }, [])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    setSearchOpen(false)
    setQuery("")
    router.push(`/products?search=${encodeURIComponent(q)}`)
  }

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-black/85 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            href="/"
            className="font-serif text-lg lg:text-2xl font-light tracking-[0.15em] lg:tracking-[0.25em] text-warm-white whitespace-nowrap"
          >
            AJABU <span className="text-amber">LIGHTING</span>
          </Link>

          {/* Desktop Nav */}
          <ul className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[0.7rem] font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-warm-white transition-colors relative group"
                >
                  {link.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-amber transition-all duration-400 group-hover:w-full" />
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen((o) => !o)}
              aria-label="Search"
              className="text-muted-foreground hover:text-warm-white transition-colors"
            >
              <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
            {isStaff && (
              <Link
                href="/admin"
                aria-label="Admin dashboard"
                title="Admin dashboard"
                className="text-amber hover:text-amber-300 transition-colors"
              >
                <LayoutDashboard className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </Link>
            )}
            <Link
              href="/account"
              className="text-muted-foreground hover:text-warm-white transition-colors hidden sm:block"
            >
              <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </Link>
            <Link
              href="/cart"
              className="text-muted-foreground hover:text-warm-white transition-colors relative"
            >
              <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-amber text-black text-[0.55rem] font-semibold rounded-full flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            <button
              className="lg:hidden text-muted-foreground hover:text-warm-white transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <Menu className="w-5 h-5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="pb-4">
            <form onSubmit={submitSearch} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for lights, fixtures, bulbs..."
                className="w-full bg-black/60 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-warm-white placeholder:text-muted-foreground outline-none focus:border-amber-500 transition-colors"
              />
            </form>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-white/5">
          <div className="px-4 py-6 space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm font-light tracking-wider text-muted-foreground hover:text-warm-white transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/account"
              className="block text-sm font-light tracking-wider text-muted-foreground hover:text-warm-white transition-colors pt-4 border-t border-white/5"
              onClick={() => setMobileOpen(false)}
            >
              My Account
            </Link>
            {isStaff && (
              <Link
                href="/admin"
                className="block text-sm font-medium tracking-wider text-amber hover:text-amber-300 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
