import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  COUPON_COLUMNS,
  evaluateCoupon,
  hasRedeemedCoupon,
  type CouponRow,
} from "@/lib/utils/coupon"
import { z } from "zod"

const schema = z.object({ subtotal: z.number().nonnegative() })

/**
 * The automatic coupon (Admin → Coupons, "Apply automatically") checkout
 * should apply for the signed-in customer, or null. Of those they qualify for
 * and haven't used, the one with the biggest discount wins; a free-delivery
 * coupon only wins when no coupon takes money off.
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { subtotal } = parsed.data

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ coupon: null })

    // Anyone can read active coupons (RLS); a customer can read their own
    // orders, which is all hasRedeemedCoupon needs.
    const { data: coupons, error } = await supabase
      .from("coupons")
      .select(COUPON_COLUMNS)
      .eq("auto_apply", true)
      .eq("is_active", true)
    if (error) {
      console.error("Auto coupon lookup failed:", error.message)
      return NextResponse.json({ coupon: null })
    }

    let best: { code: string; discount: number; freeShipping: boolean } | null = null
    for (const coupon of (coupons ?? []) as CouponRow[]) {
      const result = evaluateCoupon(coupon, subtotal)
      if (result.error) continue
      const better =
        !best ||
        result.discount > best.discount ||
        (result.discount === best.discount && result.freeShipping && !best.freeShipping)
      if (!better) continue
      if (await hasRedeemedCoupon(supabase, coupon.id, user.id)) continue
      best = { code: coupon.code, discount: result.discount, freeShipping: result.freeShipping }
    }

    return NextResponse.json({ coupon: best })
  } catch {
    return NextResponse.json({ error: "Failed to check offers" }, { status: 500 })
  }
}
