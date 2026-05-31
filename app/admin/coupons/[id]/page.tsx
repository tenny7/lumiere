import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CouponForm } from "@/components/admin/coupon-form"

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: coupon } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", id)
    .single()

  if (!coupon) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Coupon</h1>
        <p className="text-sm text-muted-foreground font-mono">{coupon.code}</p>
      </div>
      <CouponForm coupon={coupon} />
    </div>
  )
}
