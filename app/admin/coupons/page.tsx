import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDate } from "@/lib/utils/format"
import { Plus, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const typeLabels: Record<string, string> = {
  percentage: "Percentage",
  fixed_amount: "Fixed Amount",
  free_shipping: "Free Shipping",
}

function couponValue(type: string, value: number) {
  if (type === "percentage") return `${value}%`
  if (type === "fixed_amount") return formatCurrency(value)
  return "Free Shipping"
}

export default async function AdminCouponsPage() {
  const supabase = await createClient()

  const { data: coupons } = await supabase
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Coupons</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage discount codes
          </p>
        </div>
        <Button render={<Link href="/admin/coupons/new" />}>
          <Plus className="w-4 h-4 mr-2" />
          Add Coupon
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead className="text-right">Uses</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons?.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell className="font-mono font-medium">
                  {coupon.code}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {typeLabels[coupon.type]}
                </TableCell>
                <TableCell>{couponValue(coupon.type, coupon.value)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {coupon.uses_count}
                  {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {coupon.expires_at ? formatDate(coupon.expires_at) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant={coupon.is_active ? "default" : "secondary"}>
                    {coupon.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href={`/admin/coupons/${coupon.id}`} />}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!coupons || coupons.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No coupons yet</p>
                  <Button size="sm" render={<Link href="/admin/coupons/new" />}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add your first coupon
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
