import { Navbar } from "@/components/storefront/navbar"
import { Footer } from "@/components/storefront/footer"
import { WelcomeTour } from "@/components/storefront/welcome-tour"

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
