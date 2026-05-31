import { CouponForm } from "@/components/admin/coupon-form"

export default function NewCouponPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Coupon</h1>
        <p className="text-sm text-muted-foreground">Create a new discount code</p>
      </div>
      <CouponForm />
    </div>
  )
}
