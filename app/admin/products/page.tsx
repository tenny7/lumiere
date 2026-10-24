import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductsTable } from "@/components/admin/products-table"
import { parseFilters, type ProductRow } from "@/lib/admin/product-filters"
import { sizedSrc, type ImageSource } from "@/lib/images/srcset"

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const supabase = await createClient()

  const [{ data: products }, { data: categories }, params] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name, sku, category_id, base_price, sale_price, currency, stock_quantity, low_stock_threshold, is_active, is_featured, created_at, updated_at, category:categories(name), images:product_images(url, is_primary, variants)",
      )
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").order("name"),
    searchParams,
  ])

  // Only what the table needs goes to the browser.
  const rows: ProductRow[] = (products ?? []).map((p) => {
    const images = (p.images ?? []) as (ImageSource & { is_primary: boolean })[]
    const mainImage = images.find((i) => i.is_primary) ?? images[0]
    const category = (Array.isArray(p.category) ? p.category[0] : p.category) as
      | { name: string }
      | null
    const base = Number(p.base_price)
    // Same rule as before: a sale price of 0 or empty means no sale.
    const sale = p.sale_price ? Number(p.sale_price) : null
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      categoryId: p.category_id,
      categoryName: category?.name ?? null,
      basePrice: base,
      salePrice: sale,
      price: sale ?? base,
      currency: p.currency,
      stock: p.stock_quantity,
      lowStockThreshold: p.low_stock_threshold,
      isActive: p.is_active,
      isFeatured: p.is_featured,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      imageUrl: mainImage ? sizedSrc(mainImage, 96) : null,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
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

      <ProductsTable
        rows={rows}
        categories={(categories ?? []) as { id: string; name: string }[]}
        initial={parseFilters(params)}
      />
    </div>
  )
}
