import Link from "next/link"

const footerLinks = {
  shop: [
    { href: "/categories/chandeliers", label: "Chandeliers" },
    { href: "/categories/pendant-lights", label: "Pendants" },
    { href: "/categories/table-lamps", label: "Table Lamps" },
    { href: "/categories/floor-lamps", label: "Floor Lamps" },
    { href: "/categories/wall-sconces", label: "Wall Sconces" },
    { href: "/categories/smart-lights", label: "Smart Lights" },
    { href: "/categories/outdoor-lighting", label: "Outdoor" },
    { href: "/categories/led-strips", label: "LED Strips" },
  ],
  company: [
    { href: "/about", label: "Our Story" },
    { href: "/designers", label: "Designers" },
    { href: "/sustainability", label: "Sustainability" },
    { href: "/careers", label: "Careers" },
  ],
  support: [
    { href: "/contact", label: "Contact Us" },
    { href: "/shipping", label: "Shipping & Returns" },
    { href: "/faq", label: "FAQs" },
    { href: "/installation", label: "Installation Guide" },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 lg:py-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-serif text-xl font-light tracking-[0.15em] text-warm-white inline-block mb-4 whitespace-nowrap"
            >
              AJABU <span className="text-amber">LIGHTING</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">
              Curated lighting for spaces that deserve to shine. Handpicked
              fixtures from artisan makers.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-[0.65rem] font-medium tracking-[0.25em] uppercase text-warm-white mb-4">
              Shop
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-warm-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[0.65rem] font-medium tracking-[0.25em] uppercase text-warm-white mb-4">
              Company
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-warm-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[0.65rem] font-medium tracking-[0.25em] uppercase text-warm-white mb-4">
              Support
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-warm-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-white/5">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Ajabu Lighting. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              href="/privacy"
              className="text-xs text-muted-foreground hover:text-warm-white transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-muted-foreground hover:text-warm-white transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
