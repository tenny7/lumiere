"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { mergeGuestCart } from "@/lib/utils/cart"
import { notifyCartUpdated } from "@/hooks/use-cart-count"

// Last step of Google sign-in; /auth/callback has already set the session.
// Does what the password form does after signing in: moves the guest cart
// into the account, then goes on to where the person was heading. Checkout
// reads the cart once on load, so the merge has to finish before it opens.
export function FinishSignIn() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawNext = searchParams.get("next") || "/"
  // Prevent open redirect — only allow relative paths
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/"
  // React runs effects twice in development; a second merge would add the
  // guest cart twice.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    async function finish() {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user) {
          await mergeGuestCart(supabase, session.user.id)
          notifyCartUpdated()
        }
      } finally {
        router.replace(next)
        router.refresh()
      }
    }

    finish()
  }, [next, router])

  return (
    <div className="text-center">
      <h1 className="font-serif text-2xl font-light mb-2">Signing you in...</h1>
      <p className="text-sm text-[#8a8478]">One moment.</p>
    </div>
  )
}
