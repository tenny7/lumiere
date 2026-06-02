import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { evaluateCoupon, type CouponRow } from "@/lib/utils/coupon"
import { getStoreCurrency } from "@/lib/utils/settings"
import { normalizeInternationalPhone } from "@/lib/utils/phone"
import { z } from "zod"

const shippingSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(1).max(30),
  line1: z.string().min(3).max(200),
  city: z.string().min(2).max(100),
  region: z.string().max(100).optional(),
  couponCode: z.string().max(50).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const parsed = shippingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { fullName, phone: rawPhone, line1, city, region, couponCode } = parsed.data

    const normalizedPhone = normalizeInternationalPhone(rawPhone)
    if (!normalizedPhone) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid phone number including your country code, e.g. +250 781 234 567.",
        },
        { status: 400 },
      )
    }
    const phone = normalizedPhone.display

    // Load cart items from DB with current prices (server-side truth)
    const { data: cartItems, error: cartError } = await supabase
      .from("cart_items")
      .select(
        "id, quantity, product_id, variant_id, product:products(id, name, base_price, sale_price, currency, stock_quantity, is_active), variant:product_variants(id, name, price_adjustment, stock_quantity)",
      )
      .eq("profile_id", user.id)

    if (cartError || !cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // Validate stock and compute totals server-side
    const errors: string[] = []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validatedItems = cartItems.map((item: any) => {
      const product = item.product
      const variant = item.variant

      if (!product || !product.is_active) {
        errors.push(`${product?.name || "Unknown product"} is no longer available`)
        return null
      }

      const stockAvailable = variant?.stock_quantity ?? product.stock_quantity
      if (item.quantity > stockAvailable) {
        errors.push(
          `${product.name} only has ${stockAvailable} in stock (you requested ${item.quantity})`,
        )
      }

      const unitPrice =
        (product.sale_price || product.base_price) +
        (variant?.price_adjustment || 0)

      return {
        product_id: product.id,
        variant_id: variant?.id || null,
        product_name: product.name + (variant ? ` — ${variant.name}` : ""),
        quantity: item.quantity,
        unit_price: unitPrice,
        total_price: unitPrice * item.quantity,
      }
    })

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join("; ") }, { status: 400 })
    }

    const items = validatedItems.filter(Boolean)
    const subtotal = items.reduce((sum, item) => sum + item!.total_price, 0)

    const adminDb = createAdminClient()

    // Apply coupon (server-side re-validation prevents tampering)
    let discountAmount = 0
    let couponId: string | null = null
    let freeShipping = false
    if (couponCode) {
      const { data: coupon } = await adminDb
        .from("coupons")
        .select(
          "id, type, value, min_order_amount, max_uses, uses_count, starts_at, expires_at, is_active",
        )
        .eq("code", couponCode.trim().toUpperCase())
        .maybeSingle()

      const result = evaluateCoupon(coupon as CouponRow | null, subtotal)
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }
      discountAmount = result.discount
      freeShipping = result.freeShipping
      couponId = coupon!.id
    }

    const baseDelivery = subtotal >= 150 ? 0 : 25
    const deliveryFee = freeShipping ? 0 : baseDelivery
    const total = Math.max(subtotal - discountAmount, 0) + deliveryFee
    const currency = await getStoreCurrency()

    // Create order with server-calculated total
    const { data: order, error: orderError } = await adminDb
      .from("orders")
      .insert({
        customer_id: user.id,
        subtotal,
        discount_amount: discountAmount,
        delivery_fee: deliveryFee,
        total,
        currency,
        coupon_id: couponId,
        shipping_address: {
          full_name: fullName,
          phone,
          line_1: line1,
          city,
          region: region || "",
          country: "Rwanda",
        },
      })
      .select("id, order_number")
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 },
      )
    }

    // Create order items
    const { error: itemsError } = await adminDb.from("order_items").insert(
      items.map((item) => ({
        order_id: order.id,
        ...item!,
      })),
    )

    if (itemsError) {
      // Rollback: delete the order
      await adminDb.from("orders").delete().eq("id", order.id)
      return NextResponse.json(
        { error: "Failed to create order items" },
        { status: 500 },
      )
    }

    // Increment coupon usage (best-effort; order already created)
    if (couponId) {
      await adminDb.rpc("increment_coupon_uses", { p_coupon_id: couponId })
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
      total,
    })
  } catch (error) {
    console.error("Order creation error:", error)
    return NextResponse.json(
      { error: "Order creation failed" },
      { status: 500 },
    )
  }
}
