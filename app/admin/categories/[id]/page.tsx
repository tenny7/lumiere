import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CategoryForm } from "@/components/admin/category-form"

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single()

  if (!category) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Category</h1>
        <p className="text-sm text-muted-foreground">{category.name}</p>
      </div>
      <CategoryForm category={category} />
    </div>
  )
}
