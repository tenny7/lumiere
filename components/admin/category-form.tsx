"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { slugify } from "@/lib/utils/format"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import type { Category } from "@/lib/types"

export function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState(category?.name || "")
  const [slug, setSlug] = useState(category?.slug || "")
  const [description, setDescription] = useState(category?.description || "")
  const [imageUrl, setImageUrl] = useState(category?.image_url || "")
  const [sortOrder, setSortOrder] = useState(
    category?.sort_order?.toString() || "0",
  )
  const [isActive, setIsActive] = useState(category?.is_active ?? true)

  function handleNameChange(value: string) {
    setName(value)
    if (!category) setSlug(slugify(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name,
      slug,
      description: description || null,
      image_url: imageUrl || null,
      sort_order: parseInt(sortOrder) || 0,
      is_active: isActive,
    }

    if (category) {
      const { error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", category.id)
      if (error) {
        toast.error("Failed to update category")
        setLoading(false)
        return
      }
      toast.success("Category updated")
    } else {
      const { error } = await supabase.from("categories").insert(payload)
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success("Category created")
    }

    router.push("/admin/categories")
    router.refresh()
  }

  async function handleDelete() {
    if (!category) return
    if (!confirm(`Delete "${category.name}"? Products will be uncategorized.`))
      return
    setLoading(true)
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id)
    if (error) {
      toast.error("Failed to delete category")
      setLoading(false)
      return
    }
    toast.success("Category deleted")
    router.push("/admin/categories")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Category Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Chandeliers"
              required
            />
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="chandeliers"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://…"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </div>
            <div className="flex items-end justify-between pb-2">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : category
              ? "Update Category"
              : "Create Category"}
        </Button>
        {category && (
          <Button
            type="button"
            variant="outline"
            className="text-red-500 hover:text-red-500"
            disabled={loading}
            onClick={handleDelete}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}
