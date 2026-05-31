import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
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

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("sort_order", { ascending: true })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Manage product categories and organization
          </p>
        </div>
        <Button render={<Link href="/admin/categories/new" />}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="text-right">Sort Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => {
              const productCount =
                (category.products as unknown as { count: number }[])?.[0]
                  ?.count ?? 0
              return (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {category.slug}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                    {category.description || "—"}
                  </TableCell>
                  <TableCell className="text-right">{productCount}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {category.sort_order}
                  </TableCell>
                  <TableCell>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/admin/categories/${category.id}`} />}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {(!categories || categories.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <p className="text-muted-foreground mb-4">
                    No categories yet
                  </p>
                  <Button
                    size="sm"
                    render={<Link href="/admin/categories/new" />}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add your first category
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
