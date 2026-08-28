"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Search, User, ShoppingCart, Menu, X, Shield, Heart, HelpCircle, MessageSquare, Package, LogOut } from "lucide-react"
import { useCartCount } from "@/hooks/use-cart-count"
import { useWishlistCount } from "@/hooks/use-wishlist-count"
import { useUnreadMessages } from "@/hooks/use-unread-messages"
import { createClient } from "@/lib/supabase/client"
import { TOUR_EVENT } from "@/components/storefront/welcome-tour"

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
  const [signedIn, setSignedIn] = useState(false)
  const [initials, setInitials] = useState("")
  const [accountOpen, setAccountOpen] = useState(false)
  const cartCount = useCartCount()
  const wishlistCount = useWishlistCount()
  const unreadMessages = useUnreadMessages()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Determine sign-in state, staff role, and the user's initials for the avatar.
  useEffect(() => {
    const supabase = createClient()
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setSignedIn(false)
        setInitials("")
        setIsStaff(false)
        return
      }
      setSignedIn(true)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single()
      setIsStaff(!!profile && profile.role !== "customer")
      const source = profile?.full_name || user.email || ""
      const parts = source.trim().split(/\s+/)
      const init =
        parts.length >= 2
          ? (parts[0][0] || "") + (parts[1][0] || "")
          : source.slice(0, 2)
      setInitials(init.toUpperCase())
    }
    checkUser()
  }, [])

  function openTour() {
    setMobileOpen(false)
    window.dispatchEvent(new Event(TOUR_EVENT))
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setSignedIn(false)
    setInitials("")
    setIsStaff(false)
    setAccountOpen(false)
    setMobileOpen(false)
    router.push("/")
    router.refresh()
  }

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
              title="Search"
              className="text-muted-foreground hover:text-warm-white transition-colors"
            >
              <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
            <button
              onClick={openTour}
              aria-label="Take a quick tour"
              title="Take a quick tour"
              className="hidden sm:block text-muted-foreground hover:text-amber transition-colors"
            >
              <HelpCircle className="w-[18px] h-[18px]" strokeWidth={1.5} />
            </button>
            {isStaff && (
              <Link
                href="/admin"
                aria-label="Admin dashboard"
                title="Admin dashboard"
                className="text-amber hover:text-amber-300 transition-colors"
              >
                <Shield className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </Link>
            )}
            <Link
              href="/account/wishlist"
              aria-label="Wishlist"
              title="Wishlist"
              className="text-muted-foreground hover:text-warm-white transition-colors relative"
            >
              <Heart
                className={`w-[18px] h-[18px] ${wishlistCount > 0 ? "fill-amber text-amber" : ""}`}
                strokeWidth={1.5}
              />
              {wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-amber text-black text-[0.55rem] font-semibold rounded-full flex items-center justify-center">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>
            {signedIn && (
              <Link
                href="/account/messages"
                aria-label="Messages"
                title="Messages"
                className="text-muted-foreground hover:text-warm-white transition-colors relative hidden sm:block"
              >
                <MessageSquare className="w-[18px] h-[18px]" strokeWidth={1.5} />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-amber text-black text-[0.55rem] font-semibold rounded-full flex items-center justify-center">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </Link>
            )}
            <Link
              href="/cart"
              aria-label="Cart"
              title="Cart"
              className="text-muted-foreground hover:text-warm-white transition-colors relative"
            >
              <ShoppingCart className="w-[18px] h-[18px]" strokeWidth={1.5} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-amber text-black text-[0.55rem] font-semibold rounded-full flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
            {/* Account — rightmost. Avatar → dropdown when signed in, else Sign In / Sign Up. */}
            {signedIn ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setAccountOpen((o) => !o)}
                  aria-label="My account"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-black text-[0.7rem] font-semibold hover:bg-amber-400 transition-colors"
                >
                  {initials || <User className="w-4 h-4" />}
                </button>
                {accountOpen && (
                  <>
                    {/* click-away backdrop */}
                    <button
                      aria-hidden
                      tabIndex={-1}
                      onClick={() => setAccountOpen(false)}
                      className="fixed inset-0 z-40 cursor-default"
                    />
                    <div
                      role="menu"
                      className="absolute right-0 top-full mt-2 w-56 z-50 bg-black/95 backdrop-blur-xl border border-white/10 rounded-lg py-2 shadow-xl"
                    >
                      <Link
                        href="/account"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-warm-white hover:bg-white/5 transition-colors"
                      >
                        <User className="w-4 h-4" strokeWidth={1.5} /> My Account
                      </Link>
                      <Link
                        href="/account/orders"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-warm-white hover:bg-white/5 transition-colors"
                      >
                        <Package className="w-4 h-4" strokeWidth={1.5} /> My Orders
                      </Link>
                      <Link
                        href="/account/wishlist"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-warm-white hover:bg-white/5 transition-colors"
                      >
                        <Heart className="w-4 h-4" strokeWidth={1.5} /> Wishlist
                      </Link>
                      <Link
                        href="/account/messages"
                        role="menuitem"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center justify-between gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-warm-white hover:bg-white/5 transition-colors"
                      >
                        <span className="flex items-center gap-2.5">
                          <MessageSquare className="w-4 h-4" strokeWidth={1.5} /> Messages
                        </span>
                        {unreadMessages > 0 && (
                          <span className="min-w-4 h-4 px-1 bg-amber text-black text-[0.55rem] font-semibold rounded-full flex items-center justify-center">
                            {unreadMessages > 99 ? "99+" : unreadMessages}
                          </span>
                        )}
                      </Link>
                      {isStaff && (
                        <Link
                          href="/admin"
                          role="menuitem"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-amber hover:text-amber-300 hover:bg-white/5 transition-colors"
                        >
                          <Shield className="w-4 h-4" strokeWidth={1.5} /> Admin Dashboard
                        </Link>
                      )}
                      <div className="my-1 border-t border-white/10" />
                      <button
                        onClick={handleSignOut}
                        role="menuitem"
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-warm-white hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" strokeWidth={1.5} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-[0.7rem] font-medium tracking-[0.12em] uppercase text-warm-white border border-white/15 px-3 py-1.5 hover:border-amber-500 hover:text-amber transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-[0.7rem] font-medium tracking-[0.12em] uppercase bg-amber-500 text-black px-3 py-1.5 hover:bg-amber-400 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
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
            <div className="pt-4 border-t border-white/5 space-y-4">
              {/* Auth actions — kept prominent so they're never hidden on mobile */}
              {!signedIn && (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-[0.72rem] font-medium tracking-[0.15em] uppercase text-warm-white border border-white/15 py-2.5 hover:border-amber-500 hover:text-amber transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="text-center text-[0.72rem] font-medium tracking-[0.15em] uppercase bg-amber-500 text-black py-2.5 hover:bg-amber-400 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
              {signedIn && (
                <>
                  <Link
                    href="/account/orders"
                    className="flex items-center gap-2 text-sm font-light tracking-wider text-muted-foreground hover:text-warm-white transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Package className="w-4 h-4" strokeWidth={1.5} />
                    My Orders
                  </Link>
                  <Link
                    href="/account"
                    className="flex items-center gap-2 text-sm font-light tracking-wider text-muted-foreground hover:text-warm-white transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <User className="w-4 h-4" strokeWidth={1.5} />
                    My Account
                  </Link>
                  <Link
                    href="/account/messages"
                    className="flex items-center gap-2 text-sm font-light tracking-wider text-muted-foreground hover:text-warm-white transition-colors"
                    onClick={() => setMobileOpen(false)}
                  >
                    <MessageSquare className="w-4 h-4" strokeWidth={1.5} />
                    Messages{unreadMessages > 0 ? ` (${unreadMessages})` : ""}
                  </Link>
                </>
              )}
              <Link
                href="/account/wishlist"
                className="flex items-center gap-2 text-sm font-light tracking-wider text-muted-foreground hover:text-warm-white transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <Heart
                  className={`w-4 h-4 ${wishlistCount > 0 ? "fill-amber text-amber" : ""}`}
                  strokeWidth={1.5}
                />
                Wishlist{wishlistCount > 0 ? ` (${wishlistCount})` : ""}
              </Link>
              <Link
                href="/cart"
                className="flex items-center gap-2 text-sm font-light tracking-wider text-muted-foreground hover:text-warm-white transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <ShoppingCart className="w-4 h-4" strokeWidth={1.5} />
                Cart{cartCount > 0 ? ` (${cartCount})` : ""}
              </Link>
              <button
                onClick={openTour}
                className="flex items-center gap-2 text-sm font-light tracking-wider text-muted-foreground hover:text-warm-white transition-colors"
              >
                <HelpCircle className="w-4 h-4" strokeWidth={1.5} />
                Take a quick tour
              </button>
              {isStaff && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-sm font-medium tracking-wider text-amber hover:text-amber-300 transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  <Shield className="w-4 h-4" strokeWidth={1.5} />
                  Admin Dashboard
                </Link>
              )}
              {signedIn && (
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 text-sm font-light tracking-wider text-muted-foreground hover:text-warm-white transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" strokeWidth={1.5} />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
