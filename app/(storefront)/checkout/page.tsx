"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { notifyCartUpdated } from "@/hooks/use-cart-count"
import { formatCurrency } from "@/lib/utils/format"
import {
  computeOrderTotals,
  parsePricingSettings,
  PRICING_SETTING_KEYS,
  type OrderTotals,
  type PricingSettings,
} from "@/lib/utils/pricing"
import {
  MOMO_PROVIDERS,
  COD_METHOD,
  COD_METHOD_VALUE,
  MOMO_MANUAL_METHOD,
  MOMO_MANUAL_VALUE,
} from "@/lib/utils/constants"
import { Loader2, CheckCircle2, XCircle, Phone, MapPin, Plus, Banknote, Smartphone, Clock } from "lucide-react"
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

  // Address book
  type SavedAddress = {
    id: string
    label: string | null
    line_1: string
    line_2: string | null
    city: string
    region: string | null
    is_default: boolean
  }
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [addressMode, setAddressMode] = useState<"saved" | "new">("new")
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")

  function chooseAddress(addr: SavedAddress) {
    setAddressMode("saved")
    setSelectedAddressId(addr.id)
    setLine1(addr.line_1)
    setCity(addr.city)
    setRegion(addr.region || "")
  }

  function useNewAddress() {
    setAddressMode("new")
    setSelectedAddressId("")
    setLine1("")
    setCity("")
    setRegion("")
  }

  // Coupon
  const [couponInput, setCouponInput] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount: number
    freeShipping: boolean
  } | null>(null)

  // Payment
  const [availableProviders, setAvailableProviders] = useState<
    (typeof MOMO_PROVIDERS)[number][]
  >([...MOMO_PROVIDERS])
  const [provider, setProvider] = useState<string>("momo_mtn")
  const [codEnabled, setCodEnabled] = useState(true)
  const [momoManualEnabled, setMomoManualEnabled] = useState(true)
  const [momoManualNumber, setMomoManualNumber] = useState("")
  const [momoManualName, setMomoManualName] = useState("")
  // Optional USSD dial string from admin settings; "{amount}" is filled in.
  const [momoUssdCode, setMomoUssdCode] = useState("")
  const isCod = provider === COD_METHOD_VALUE
  const isMomoManual = provider === MOMO_MANUAL_VALUE
  const [momoPhone, setMomoPhone] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "pending" | "polling" | "success" | "failed">("idle")
  const [orderId, setOrderId] = useState("")
  const [orderNumber, setOrderNumber] = useState("")
  // Server-computed charges for the created order (what is actually owed).
  const [orderBreakdown, setOrderBreakdown] = useState<OrderTotals | null>(null)
  // Admin pricing (delivery fee, free-delivery threshold, VAT) for the estimate.
  const [pricing, setPricing] = useState<PricingSettings>({
    deliveryFee: 0,
    freeShippingThreshold: 0,
    taxRate: 0,
  })
  const [storeCurrency, setStoreCurrency] = useState("RWF")

  useEffect(() => {
    async function loadCart() {
      // Local session read (no network hop). Every query below is RLS-scoped,
      // and order creation re-validates the user server-side.
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const user = session?.user
      if (!user) {
        router.push("/login?redirect=/checkout")
        return
      }

      // The four lookups are independent — fetch them in parallel instead of
      // one after another (4 round trips → 1).
      const [
        { data: profile },
        { data: addrs },
        { data },
        { data: settingsRows },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .single(),
        // Saved addresses — default to the user's default address, like Amazon.
        supabase
          .from("addresses")
          .select("id, label, line_1, line_2, city, region, is_default")
          .eq("profile_id", user.id)
          .order("is_default", { ascending: false }),
        supabase
          .from("cart_items")
          .select("id, quantity, product:products(name, base_price, sale_price, currency), variant:product_variants(name, price_adjustment)")
          .eq("profile_id", user.id),
        // Enabled payment methods + the manual MoMo transfer details. With no
        // explicit setting, everything is available.
        supabase
          .from("store_settings")
          .select("key, value")
          .in("key", [
            "active_payment_providers",
            "momo_manual_number",
            "momo_manual_name",
            "momo_ussd_code",
            "store_currency",
            ...PRICING_SETTING_KEYS,
          ]),
      ])

      if (profile) {
        setFullName(profile.full_name)
        if (profile.phone) {
          setPhone(profile.phone)
          setMomoPhone(profile.phone)
        }
      }

      if (addrs && addrs.length > 0) {
        setSavedAddresses(addrs)
        const def = addrs.find((a) => a.is_default) || addrs[0]
        chooseAddress(def)
      }

      if (data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setCartItems(data as any)
      } else {
        router.push("/cart")
        return
      }

      const settingsMap: Record<string, unknown> = {}
      for (const r of settingsRows || []) settingsMap[r.key] = r.value
      setPricing(parsePricingSettings(settingsRows))
      if (typeof settingsMap.store_currency === "string" && settingsMap.store_currency) {
        setStoreCurrency(settingsMap.store_currency.toUpperCase())
      }
      const active = Array.isArray(settingsMap.active_payment_providers)
        ? (settingsMap.active_payment_providers as string[])
        : null
      const manualNumber =
        typeof settingsMap.momo_manual_number === "string"
          ? settingsMap.momo_manual_number
          : ""
      const manualName =
        typeof settingsMap.momo_manual_name === "string"
          ? settingsMap.momo_manual_name
          : ""
      setMomoManualNumber(manualNumber)
      setMomoManualName(manualName)
      if (typeof settingsMap.momo_ussd_code === "string") {
        setMomoUssdCode(settingsMap.momo_ussd_code.trim())
      }

      const codOn = !active || active.includes(COD_METHOD_VALUE)
      // Manual transfer needs a configured number to be usable.
      const momoManualOn =
        (!active || active.includes(MOMO_MANUAL_VALUE)) && !!manualNumber
      setCodEnabled(codOn)
      setMomoManualEnabled(momoManualOn)
      const filteredMomo = active
        ? MOMO_PROVIDERS.filter((p) => active.includes(p.value))
        : [...MOMO_PROVIDERS]
      setAvailableProviders(filteredMomo)
      // Default to MoMo transfer when available (the primary method), then the
      // API MoMo providers, then Cash on Delivery.
      if (momoManualOn) {
        setProvider(MOMO_MANUAL_VALUE)
      } else if (filteredMomo.length > 0) {
        setProvider(filteredMomo[0].value)
      } else if (codOn) {
        setProvider(COD_METHOD_VALUE)
      }
    }
    loadCart()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Steps are swapped in-place (not routed), so scroll back to the top when the
  // step changes — otherwise the payment step opens scrolled to the bottom.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  const subtotal = cartItems.reduce((sum, item) => {
    const price = (item.product.sale_price || item.product.base_price) + (item.variant?.price_adjustment || 0)
    return sum + price * item.quantity
  }, 0)

  // Same calculation the server uses: delivery fee + free-delivery threshold +
  // VAT from Admin → Settings, each added once.
  const estimate = computeOrderTotals({
    subtotal,
    discount: appliedCoupon?.discount ?? 0,
    couponFreeShipping: !!appliedCoupon?.freeShipping,
    settings: pricing,
    currency: storeCurrency,
  })
  const { discount, deliveryFee, taxAmount, total } = estimate
  // Charges shown on the payment step: the server-computed figures once the
  // order exists (what the admin verifies a transfer against), else the
  // cart estimate.
  const shown = orderBreakdown ?? estimate
  const amountDue = shown.total
  // Ready-to-dial USSD string for this order (whole francs for "{amount}").
  const ussdCode = momoUssdCode.replace(
    /\{amount\}/g,
    String(Math.round(amountDue)),
  )

  function copyText(value: string, message: string) {
    navigator.clipboard
      ?.writeText(value)
      .then(() => toast.success(message))
      .catch(() => {})
  }

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
      setOrderBreakdown({
        subtotal: Number(data.subtotal),
        discount: Number(data.discount),
        deliveryFee: Number(data.deliveryFee),
        taxAmount: Number(data.taxAmount),
        total: Number(data.total),
      })
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

  async function handleCod() {
    setPaymentStatus("pending")
    try {
      const res = await fetch("/api/payments/cod", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Failed to place order")
        setPaymentStatus("failed")
        return
      }

      // Clear the cart, matching the MoMo success path.
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("cart_items").delete().eq("profile_id", user.id)
      }
      notifyCartUpdated()
      setPaymentStatus("success")
      setStep("confirmation")
    } catch {
      toast.error("Network error. Please try again.")
      setPaymentStatus("failed")
    }
  }

  async function handleMomoManual() {
    setPaymentStatus("pending")
    try {
      const res = await fetch("/api/payments/momo-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, momoPhone }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Couldn't record your payment")
        setPaymentStatus("failed")
        return
      }

      // Clear the cart, matching the other success paths.
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("cart_items").delete().eq("profile_id", user.id)
      }
      notifyCartUpdated()
      setPaymentStatus("success")
      setStep("confirmation")
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
                  placeholder="+250 781 234 567 (with country code)"
                  required
                  className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              {/* Saved address book — choose one or add a new address */}
              {savedAddresses.length > 0 && (
                <div>
                  <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                    Deliver To
                  </label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {savedAddresses.map((addr) => {
                      const active =
                        addressMode === "saved" && selectedAddressId === addr.id
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => chooseAddress(addr)}
                          className={`text-left p-4 border transition-colors ${
                            active
                              ? "border-amber-500 bg-amber-500/[0.06]"
                              : "border-[#242320] hover:border-amber-500/40"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[0.6rem] font-medium tracking-wider uppercase text-amber-400">
                              {addr.label || "Address"}
                            </span>
                            {addr.is_default && (
                              <span className="text-[0.55rem] tracking-wider uppercase text-[#8a8478]">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm">
                            {addr.line_1}
                            {addr.line_2 ? `, ${addr.line_2}` : ""}
                          </p>
                          <p className="text-xs text-[#8a8478]">
                            {addr.city}
                            {addr.region ? `, ${addr.region}` : ""}
                          </p>
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={useNewAddress}
                      className={`flex items-center gap-2 p-4 border border-dashed transition-colors ${
                        addressMode === "new"
                          ? "border-amber-500 text-amber-400"
                          : "border-[#242320] text-[#8a8478] hover:border-amber-500/40"
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm">Use a new address</span>
                    </button>
                  </div>
                </div>
              )}

              {(addressMode === "new" || savedAddresses.length === 0) && (
                <>
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
                </>
              )}

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
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm text-[#8a8478]">
                      <span>VAT ({pricing.taxRate}%)</span>
                      <span>{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
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
            <h1 className="font-serif text-2xl font-light mb-1">Payment</h1>
            <p className="text-sm text-[#8a8478] mb-6">Order {orderNumber}</p>

            {/* Amount due — the figure the customer acts on, so it leads */}
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border border-amber-500/30 bg-linear-to-br from-amber-500/8 to-transparent p-5 sm:p-6">
              <div>
                <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.3em] text-amber-400">
                  Amount to pay
                </p>
                <p className="font-serif text-4xl font-light leading-none tabular-nums text-[#f5f0e8] sm:text-5xl">
                  {formatCurrency(amountDue)}
                </p>
              </div>
              <div className="space-y-0.5 text-right text-xs text-[#8a8478] tabular-nums">
                <p>Subtotal {formatCurrency(shown.subtotal)}</p>
                {shown.discount > 0 && (
                  <p className="text-green-400">
                    Discount −{formatCurrency(shown.discount)}
                  </p>
                )}
                <p>
                  Delivery{" "}
                  {shown.deliveryFee === 0
                    ? "Free"
                    : formatCurrency(shown.deliveryFee)}
                </p>
                {shown.taxAmount > 0 && (
                  <p>VAT {formatCurrency(shown.taxAmount)}</p>
                )}
              </div>
            </div>

            {paymentStatus === "idle" || paymentStatus === "failed" ? (
              <div className="space-y-6">
                {/* Payment Method Selection */}
                <div>
                  <p className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-3">
                    Select Payment Method
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {availableProviders.map((p) => (
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
                    {momoManualEnabled && (
                      <button
                        onClick={() => setProvider(MOMO_MANUAL_VALUE)}
                        className={`p-4 border text-center transition-colors ${
                          isMomoManual
                            ? "border-amber-500 bg-amber-500/5"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <Smartphone
                          className="w-4 h-4 mx-auto mb-1.5"
                          style={{ color: MOMO_MANUAL_METHOD.color }}
                        />
                        <span className="text-[0.65rem] leading-tight block">
                          {MOMO_MANUAL_METHOD.label}
                        </span>
                      </button>
                    )}
                    {codEnabled && (
                      <button
                        onClick={() => setProvider(COD_METHOD_VALUE)}
                        className={`p-4 border text-center transition-colors ${
                          isCod
                            ? "border-amber-500 bg-amber-500/5"
                            : "border-white/10 hover:border-white/20"
                        }`}
                      >
                        <Banknote
                          className="w-4 h-4 mx-auto mb-1.5"
                          style={{ color: COD_METHOD.color }}
                        />
                        <span className="text-[0.65rem] leading-tight block">
                          {COD_METHOD.label}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Phone Number (API MoMo only) */}
                {!isCod && !isMomoManual && (
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
                        placeholder="+250 781 234 567 (with country code)"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Manual MoMo transfer — show the store's number + steps */}
                {isMomoManual && (
                  <div className="space-y-4">
                    <div className="bg-[#1a1918] border border-amber-500/20 divide-y divide-white/5">
                      <div className="flex items-center justify-between gap-3 p-5">
                        <div>
                          <p className="mb-1 text-[0.65rem] font-medium uppercase tracking-[0.25em] text-[#8a8478]">
                            Send exactly
                          </p>
                          <p className="font-serif text-3xl leading-tight tabular-nums text-amber-400">
                            {formatCurrency(amountDue)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(String(amountDue), "Amount copied")
                          }
                          className="shrink-0 px-3 py-2 border border-white/10 text-[0.65rem] uppercase tracking-wider hover:border-amber-500/50 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-3 p-5">
                        <div>
                          <p className="mb-1 text-[0.65rem] font-medium uppercase tracking-[0.25em] text-[#8a8478]">
                            To this MoMo number
                          </p>
                          <p className="text-xl font-medium tracking-wide tabular-nums text-[#f5f0e8]">
                            {momoManualNumber}
                          </p>
                          {momoManualName && (
                            <p className="text-sm text-[#8a8478]">
                              {momoManualName}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(momoManualNumber, "Number copied")
                          }
                          className="shrink-0 px-3 py-2 border border-white/10 text-[0.65rem] uppercase tracking-wider hover:border-amber-500/50 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      {ussdCode && (
                        <div className="flex items-center justify-between gap-3 p-5">
                          <div className="min-w-0">
                            <p className="mb-1 text-[0.65rem] font-medium uppercase tracking-[0.25em] text-[#8a8478]">
                              Or dial
                            </p>
                            <p className="font-mono text-lg tracking-wide text-[#f5f0e8] break-all">
                              {ussdCode}
                            </p>
                            <p className="mt-1 text-xs text-[#8a8478]">
                              On iPhone, copy it and paste it into the Phone app.
                            </p>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            {/* tel: link opens the dialer pre-filled on Android
                                (# must be encoded as %23). iOS ignores
                                tel: links containing * or #. */}
                            <a
                              href={`tel:${encodeURIComponent(ussdCode)}`}
                              className="px-3 py-2 bg-amber-500 text-black text-[0.65rem] font-medium uppercase tracking-wider hover:bg-amber-400 transition-colors"
                            >
                              Dial
                            </a>
                            <button
                              type="button"
                              onClick={() => copyText(ussdCode, "Code copied")}
                              className="px-3 py-2 border border-white/10 text-[0.65rem] uppercase tracking-wider hover:border-amber-500/50 transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      )}
                      <ol className="p-5 text-xs text-[#8a8478] space-y-1 list-decimal list-inside">
                        <li>
                          {ussdCode
                            ? "Dial the code above, or open your Mobile Money app."
                            : "Open your Mobile Money app or dial the USSD code."}
                        </li>
                        <li>
                          Send exactly {formatCurrency(amountDue)} to the number
                          above.
                        </li>
                        <li>Use order {orderNumber} as the reference if asked.</li>
                        <li>Tap &ldquo;I have paid&rdquo; once it&apos;s done.</li>
                      </ol>
                    </div>
                    <div>
                      <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
                        Number you sent from (optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8478]" />
                        <input
                          type="tel"
                          value={momoPhone}
                          onChange={(e) => setMomoPhone(e.target.value)}
                          placeholder="+250 781 234 567"
                          className="w-full pl-10 pr-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                      <p className="text-xs text-[#8a8478] mt-1.5">
                        Helps us match your transfer faster.
                      </p>
                    </div>
                  </div>
                )}

                {paymentStatus === "failed" && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">
                      Payment failed. Please check your balance and try again.
                    </p>
                  </div>
                )}

                {isCod ? (
                  <>
                    <button
                      onClick={handleCod}
                      className="w-full py-3.5 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors"
                    >
                      Place Order — Pay {formatCurrency(amountDue)} on Delivery
                    </button>
                    <p className="text-xs text-[#8a8478] text-center">
                      No payment now. Pay with cash when your order is delivered.
                    </p>
                  </>
                ) : isMomoManual ? (
                  <>
                    <button
                      onClick={handleMomoManual}
                      disabled={!momoManualNumber}
                      className="w-full py-3.5 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
                    >
                      I have paid — I&apos;ve sent {formatCurrency(amountDue)}
                    </button>
                    <p className="text-xs text-[#8a8478] text-center">
                      We&apos;ll verify your transfer and confirm your order by
                      email.
                    </p>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handlePayment}
                      className="w-full py-3.5 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors"
                    >
                      Pay {formatCurrency(amountDue)} with MoMo
                    </button>
                    <p className="text-xs text-[#8a8478] text-center">
                      You will receive a prompt on your phone to confirm payment
                    </p>
                  </>
                )}
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
                      {isCod || isMomoManual
                        ? "Placing your order"
                        : "Waiting for payment"}
                    </h2>
                    <p className="text-sm text-[#8a8478] mb-2">
                      {isCod || isMomoManual
                        ? "One moment while we record your order"
                        : "Check your phone for the MoMo prompt and enter your PIN"}
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
            {/* Only a completed MoMo (API) payment is confirmed here. A MoMo
                transfer stays pending until an admin verifies it; Cash on
                Delivery is placed but unpaid until delivery. */}
            {isMomoManual ? (
              <Clock className="w-16 h-16 text-amber-400 mx-auto mb-6" />
            ) : (
              <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-6" />
            )}
            <h1 className="font-serif text-3xl font-light mb-3">
              {isMomoManual
                ? "Order placed — awaiting payment check"
                : isCod
                  ? "Order placed"
                  : "Order Confirmed!"}
            </h1>
            <p className="text-[#8a8478] mb-1">Order number</p>
            <p className="text-lg font-medium text-amber-400 mb-6">
              {orderNumber}
            </p>
            {isMomoManual ? (
              <p className="text-sm text-[#8a8478] max-w-md mx-auto mb-8 leading-relaxed">
                Thanks — we&apos;ve received your notice that you sent{" "}
                <span className="text-[#f5f0e8]">{formatCurrency(amountDue)}</span>.
                We&apos;ll check the transfer and email you as soon as your order
                is confirmed.
              </p>
            ) : isCod ? (
              <p className="text-sm text-[#8a8478] max-w-md mx-auto mb-8 leading-relaxed">
                Pay{" "}
                <span className="text-[#f5f0e8]">{formatCurrency(amountDue)}</span>{" "}
                in cash when your order is delivered. We&apos;ll email you when it
                ships.
              </p>
            ) : (
              <p className="text-sm text-[#8a8478] max-w-md mx-auto mb-8 leading-relaxed">
                Thank you for shopping with Ajabu Lighting. We&apos;ll send you an
                email confirmation and notify you when your order ships.
              </p>
            )}

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
              {orderId && (
                <a
                  href={`/invoice/${orderId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 border border-white/10 text-[0.72rem] font-light tracking-[0.2em] uppercase hover:border-amber-500/50 transition-colors"
                >
                  {/* Only a completed MoMo (API) payment has a receipt yet. */}
                  {isCod || isMomoManual ? "View Invoice" : "View Receipt"}
                </a>
              )}
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
