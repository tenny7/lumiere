import type { Metadata } from "next"
import { Cormorant_Garamond, Outfit } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
})

const sans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600"],
})

export const metadata: Metadata = {
  title: "Lumiere — Curated Light for Every Space",
  description:
    "Handpicked lighting fixtures — chandeliers, pendants, smart lights, outdoor lighting and more. Transform your space from simply lit to truly luminous.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
