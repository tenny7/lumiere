import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils/format"
import { getStockLabel } from "@/lib/utils/format"
import { Plus } from "lucide-react"
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

export default async function AdminProductsPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from("products")
    .select("*, category:categories(name), images:product_images(url, is_primary)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your lighting product catalog
          </p>
        </div>
        <Button render={<Link href="/admin/products/new" />}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12" />
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((product) => {
              const img =
                product.images?.find((i: { is_primary: boolean }) => i.is_primary) ||
                product.images?.[0]
              const stock = getStockLabel(
                product.stock_quantity,
                product.low_stock_threshold,
              )

              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="w-10 h-10 bg-muted rounded overflow-hidden">
                      {img ? (
                        <img
                          src={img.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-amber-500/10 to-transparent" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="font-medium hover:underline"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category?.name || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {product.sku || "—"}
                  </TableCell>
                  <TableCell>
                    {product.sale_price ? (
                      <div>
                        <span>{formatCurrency(product.sale_price, product.currency)}</span>
                        <span className="text-muted-foreground line-through ml-1 text-xs">
                          {formatCurrency(product.base_price, product.currency)}
                        </span>
                      </div>
                    ) : (
                      formatCurrency(product.base_price, product.currency)
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={`text-[0.6rem] ${
                        stock.variant === "success"
                          ? "bg-green-500/10 text-green-500"
                          : stock.variant === "warning"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : "bg-red-500/10 text-red-500"
                      }`}
                    >
                      {product.stock_quantity} in stock
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={product.is_active ? "default" : "secondary"}
                    >
                      {product.is_active ? "Active" : "Draft"}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
            {(!products || products.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No products yet
                  </p>
                  <Button size="sm" render={<Link href="/admin/products/new" />}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add your first product
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
