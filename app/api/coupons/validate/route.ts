import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { evaluateCoupon, type CouponRow } from "@/lib/utils/coupon"
import { z } from "zod"

const schema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().nonnegative(),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    const { code, subtotal } = parsed.data

    // Anyone can read active coupons (RLS), which is all we need to validate.
    const supabase = await createClient()
    const { data: coupon } = await supabase
      .from("coupons")
      .select(
        "id, type, value, min_order_amount, max_uses, uses_count, starts_at, expires_at, is_active",
      )
      .eq("code", code.trim().toUpperCase())
      .maybeSingle()

    const result = evaluateCoupon(coupon as CouponRow | null, subtotal)
    if (result.error) {
      return NextResponse.json({ valid: false, error: result.error })
    }

    return NextResponse.json({
      valid: true,
      discount: result.discount,
      freeShipping: result.freeShipping,
      code: code.trim().toUpperCase(),
    })
  } catch {
    return NextResponse.json(
      { error: "Failed to validate coupon" },
      { status: 500 },
    )
  }
}
