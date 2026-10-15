import { Navbar } from "@/components/storefront/navbar"
import { Footer } from "@/components/storefront/footer"
import { WelcomeTour } from "@/components/storefront/welcome-tour"

// The footer shows the social links from Admin → Settings. Saving settings
// refreshes every page at once (/api/admin/settings/revalidate); this hourly
// refresh is the fallback for static pages if that call is ever missed.
export const revalidate = 3600

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a08] text-[#f5f0e8]">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <WelcomeTour />
    </div>
  )
}
