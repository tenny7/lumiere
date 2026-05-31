import { CategoryForm } from "@/components/admin/category-form"

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Category</h1>
        <p className="text-sm text-muted-foreground">
          Create a new product category
        </p>
      </div>
      <CategoryForm />
    </div>
  )
}
