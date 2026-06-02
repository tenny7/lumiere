"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Heart, ShoppingBag, CreditCard, X, ArrowRight, ArrowLeft } from "lucide-react"

const STORAGE_KEY = "ajabu_welcome_tour_done"

const STEPS = [
  {
    icon: Search,
    title: "Welcome to Ajabu Lighting",
    body: "Curated lighting, delivered. Here's how to shop in under a minute — it's quick.",
  },
  {
    icon: Heart,
    title: "Browse & save favourites",
    body: "Use Shop All or the categories up top. Hover any product and tap the heart to save it — the ♡ in the nav shows your saved count.",
  },
  {
    icon: ShoppingBag,
    title: "Add to cart",
    body: "Tap the bag on a product (or its page) to add it. The cart icon shows a live count, so you always know what's in your bag.",
  },
  {
    icon: CreditCard,
    title: "Checkout & track",
    body: "Pay securely with Mobile Money, then follow your order's live tracking from your account.",
  },
] as const

export function WelcomeTour() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== "1") setOpen(true)
  }, [])

  if (!open) return null

  function finish(goShop: boolean) {
    localStorage.setItem(STORAGE_KEY, "1")
    setOpen(false)
    if (goShop) router.push("/products")
  }

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        aria-label="Close tour"
        onClick={() => finish(false)}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md border border-white/10 bg-[#141410] p-8 shadow-2xl">
        <button
          onClick={() => finish(false)}
          aria-label="Skip tour"
          className="absolute top-4 right-4 text-[#8a8478] hover:text-[#f5f0e8] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>

        <h2 className="font-serif text-2xl font-light mb-2 text-[#f5f0e8]">
          {current.title}
        </h2>
        <p className="text-sm leading-relaxed text-[#8a8478] min-h-[3.5rem]">
          {current.body}
        </p>

        {/* Progress dots */}
        <div className="mt-6 flex items-center gap-1.5">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-amber-500" : "w-1.5 bg-white/15"
              }`}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="mt-7 flex items-center justify-between">
          <button
            onClick={() => finish(false)}
            className="text-xs tracking-wider uppercase text-[#8a8478] hover:text-[#f5f0e8] transition-colors"
          >
            Skip
          </button>
          <div className="flex items-center gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-1.5 text-xs tracking-wider uppercase text-[#8a8478] hover:text-[#f5f0e8] transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? finish(true) : setStep((s) => s + 1))}
              className="inline-flex items-center gap-2 bg-amber-500 px-5 py-2.5 text-[0.7rem] font-medium tracking-[0.15em] uppercase text-black hover:bg-amber-400 transition-colors"
            >
              {isLast ? "Start shopping" : "Next"}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
