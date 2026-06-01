"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { notifyCartUpdated } from "@/hooks/use-cart-count"
import { formatCurrency } from "@/lib/utils/format"
import { MOMO_PROVIDERS } from "@/lib/utils/constants"
import { Loader2, CheckCircle2, XCircle, Phone, MapPin } from "lucide-react"
import { toast } from "sonner"

type Step = "shipping" | "payment" | "confirmation"

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState<Step>("shipping")
  const [loading, setLoading] = useState(false)
  const [cartItems, setCartItems] = useState<
    Array<{
      id: string
      quantity: number
      product: { name: string; base_price: number; sale_price: number | null; currency: string }
      variant: { name: string; price_adjustment: number } | null
    }>
  >([])

  // Shipping
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [line1, setLine1] = useState("")
  const [city, setCity] = useState("")
  const [region, setRegion] = useState("")

  // Coupon
  const [couponInput, setCouponInput] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount: number
    freeShipping: boolean
  } | null>(null)

  // Payment
  const [provider, setProvider] = useState<string>("momo_mtn")
  const [momoPhone, setMomoPhone] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "polling" | "success" | "failed">("idle")
  const [orderId, setOrderId] = useState("")
  const [orderNumber, setOrderNumber] = useState("")

  useEffect(() => {
    async function loadCart() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login?redirect=/checkout")
        return
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name)
        if (profile.phone) {
          setPhone(profile.phone)
          setMomoPhone(profile.phone)
        }
      }

      const { data } = await supabase
        .from("cart_items")
        .select("id, quantity, product:products(name, base_price, sale_price, currency), variant:product_variants(name, price_adjustment)")
        .eq("profile_id", user.id)

      if (data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCartItems(data as any)
      } else {
        router.push("/cart")
      }
    }
    loadCart()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = cartItems.reduce((sum, item) => {
    const price = (item.product.sale_price || item.product.base_price) + (item.variant?.price_adjustment || 0)
    return sum + price * item.quantity
  }, 0)

  const baseDelivery = subtotal >= 150 ? 0 : 25
  const discount = appliedCoupon?.discount ?? 0
  const deliveryFee = appliedCoupon?.freeShipping ? 0 : baseDelivery
  const total = Math.max(subtotal - discount, 0) + deliveryFee

  async function applyCoupon() {
    const code = couponInput.trim()
    if (!code) return
    setCouponLoading(true)
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      })
      const data = await res.json()
      if (!res.ok || !data.valid) {
        setAppliedCoupon(null)
        toast.error(data.error || "Invalid coupon")
      } else {
        setAppliedCoupon({
          code: data.code,
          discount: data.discount,
          freeShipping: data.freeShipping,
        })
        toast.success("Coupon applied")
      }
    } catch {
      toast.error("Failed to apply coupon")
    }
    setCouponLoading(false)
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponInput("")
  }

  async function handleCreateOrder() {
    setLoading(true)

    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          line1,
          city,
          region,
          couponCode: appliedCoupon?.code,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to create order")
        setLoading(false)
        return
      }

      setOrderId(data.orderId)
      setOrderNumber(data.orderNumber)
      setStep("payment")
    } catch {
      toast.error("Network error. Please try again.")
    }

    setLoading(false)
  }

  async function handlePayment() {
    setPaymentStatus("pending")

    try {
      const res = await fetch("/api/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          provider,
          phoneNumber: momoPhone,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Payment initiation failed")
        setPaymentStatus("failed")
        return
      }

      // Start polling
      setPaymentStatus("polling")
      const paymentId = data.paymentId
      let attempts = 0
      const maxAttempts = 24 // 2 minutes at 5s intervals

      const poll = setInterval(async () => {
        attempts++
        try {
          const statusRes = await fetch(`/api/payments/${paymentId}/status`)
          const statusData = await statusRes.json()

          if (statusData.status === "successful") {
            clearInterval(poll)
            setPaymentStatus("success")
            // Clear the user's cart (RLS scopes this to the current user)
            const {
              data: { user },
            } = await supabase.auth.getUser()
            if (user) {
              await supabase
                .from("cart_items")
                .delete()
                .eq("profile_id", user.id)
            }
            notifyCartUpdated()
            setTimeout(() => setStep("confirmation"), 1500)
          } else if (statusData.status === "failed") {
            clearInterval(poll)
            setPaymentStatus("failed")
            toast.error(statusData.reason || "Payment failed")
          } else if (attempts >= maxAttempts) {
            clearInterval(poll)
            setPaymentStatus("failed")
            toast.error("Payment timed out. Check your phone and try again.")
          }
        } catch {
          // Continue polling on network errors
        }
      }, 5000)
    } catch {
      toast.error("Network error. Please try again.")
      setPaymentStatus("failed")
    }
  }

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-8 mb-12">
          {(["shipping", "payment", "confirmation"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === s
                    ? "bg-amber-500 text-black"
                    : i < ["shipping", "payment", "confirmation"].indexOf(step)
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-[#1a1918] text-[#8a8478]"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs uppercase tracking-wider hidden sm:block ${step === s ? "text-[#f5f0e8]" : "text-[#8a8478]"}`}
              >
                {s}
              </span>
            </div>
          ))}
        </div>

        {/* ═══ STEP 1: SHIPPING ═══ */}
        {step === "shipping" && (
          <div>
            <h1 className="font-serif text-2xl font-light mb-8">
              Shipping Information
            </h1>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleCreateOrder()
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                  Address
                </label>
                <input
                  type="text"
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Street address"
                  required
                  className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                    Region
                  </label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Order summary */}
              <div className="mt-8 bg-[#1a1918] border border-white/[0.03] p-5">
                <h3 className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-4">
                  Order Summary
                </h3>
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm mb-2">
                    <span className="text-[#8a8478]">
                      {item.product.name} x{item.quantity}
                    </span>
                    <span>
                      {formatCurrency(
                        ((item.product.sale_price || item.product.base_price) +
                          (item.variant?.price_adjustment || 0)) *
                          item.quantity,
                      )}
                    </span>
                  </div>
                ))}

                {/* Coupon */}
                <div className="border-t border-white/5 pt-3 mt-3">
                  {appliedCoupon ? (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-400">
                        Coupon {appliedCoupon.code} applied
                      </span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-xs text-[#8a8478] hover:text-rose-400 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Coupon code"
                        className="flex-1 px-3 py-2 bg-[#0f0e0d] border border-[#242320] text-sm text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={couponLoading || !couponInput.trim()}
                        className="px-4 py-2 border border-white/10 text-xs uppercase tracking-wider hover:border-amber-500/50 transition-colors disabled:opacity-50"
                      >
                        {couponLoading ? "..." : "Apply"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/5 pt-3 mt-3 space-y-2">
                  <div className="flex justify-between text-sm text-[#8a8478]">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-400">
                      <span>Discount</span>
                      <span>−{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-[#8a8478]">
                    <span>Delivery</span>
                    <span>
                      {deliveryFee === 0 ? "Free" : formatCurrency(deliveryFee)}
                    </span>
                  </div>
                  <div className="flex justify-between font-medium pt-2 border-t border-white/5">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
              >
                {loading ? "Creating order..." : "Continue to Payment"}
              </button>
            </form>
          </div>
        )}

        {/* ═══ STEP 2: PAYMENT ═══ */}
        {step === "payment" && (
          <div>
            <h1 className="font-serif text-2xl font-light mb-2">
              Mobile Money Payment
            </h1>
            <p className="text-sm text-[#8a8478] mb-8">
              Order {orderNumber} — {formatCurrency(total)}
            </p>

            {paymentStatus === "idle" || paymentStatus === "failed" ? (
              <div className="space-y-6">
                {/* Provider Selection */}
                <div>
                  <p className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-3">
                    Select Provider
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {MOMO_PROVIDERS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setProvider(p.value)}
                        className={`p-4 border text-center transition-colors ${
                          provider === p.value
                            ? "border-amber-500 bg-amber-500/5"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div
                          className="w-3 h-3 rounded-full mx-auto mb-2"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-[0.65rem] leading-tight block">
                          {p.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                    MoMo Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8478]" />
                    <input
                      type="tel"
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      placeholder="024 XXX XXXX"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {paymentStatus === "failed" && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">
                      Payment failed. Please check your balance and try again.
                    </p>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  className="w-full py-3.5 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors"
                >
                  Pay {formatCurrency(total)} with MoMo
                </button>

                <p className="text-xs text-[#8a8478] text-center">
                  You will receive a prompt on your phone to confirm payment
                </p>
              </div>
            ) : (
              /* Payment in progress */
              <div className="text-center py-12">
                {paymentStatus === "success" ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h2 className="font-serif text-xl mb-2">
                      Payment Successful!
                    </h2>
                    <p className="text-sm text-[#8a8478]">
                      Redirecting to confirmation...
                    </p>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-12 h-12 text-amber-400 mx-auto mb-4 animate-spin" />
                    <h2 className="font-serif text-xl mb-2">
                      Waiting for payment
                    </h2>
                    <p className="text-sm text-[#8a8478] mb-2">
                      Check your phone for the MoMo prompt and enter your PIN
                    </p>
                    <p className="text-xs text-amber-400">
                      Do not close this page
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 3: CONFIRMATION ═══ */}
        {step === "confirmation" && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h1 className="font-serif text-3xl font-light mb-3">
              Order Confirmed!
            </h1>
            <p className="text-[#8a8478] mb-1">Order number</p>
            <p className="text-lg font-medium text-amber-400 mb-6">
              {orderNumber}
            </p>
            <p className="text-sm text-[#8a8478] max-w-md mx-auto mb-8 leading-relaxed">
              Thank you for shopping with Ajabu Lighting. We&apos;ll send you an email
              confirmation and notify you when your order ships.
            </p>

            <div className="bg-[#1a1918] border border-white/[0.03] p-5 max-w-sm mx-auto text-left mb-8">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-4 h-4 text-[#8a8478] mt-0.5" />
                <div className="text-sm">
                  <p>{fullName}</p>
                  <p className="text-[#8a8478]">{line1}</p>
                  <p className="text-[#8a8478]">
                    {city}
                    {region && `, ${region}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#8a8478]" />
                <p className="text-sm text-[#8a8478]">{phone}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/account/orders"
                className="px-8 py-3 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors"
              >
                View Orders
              </Link>
              <Link
                href="/products"
                className="px-8 py-3 border border-white/10 text-[0.72rem] font-light tracking-[0.2em] uppercase hover:border-amber-500/50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
