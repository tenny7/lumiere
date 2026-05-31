import { ProductForm } from "@/components/admin/product-form"

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Product</h1>
        <p className="text-sm text-muted-foreground">
          Add a new lighting fixture to your catalog
        </p>
      </div>
      <ProductForm />
    </div>
  )
}
