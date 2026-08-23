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
import { Upload, X } from "lucide-react"
import type { Category } from "@/lib/types"

export function CategoryForm({ category }: { category?: Category }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("folder", "categories")
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Upload failed")
        return
      }
      setImageUrl(data.url)
      toast.success("Image uploaded")
    } catch {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
      e.target.value = "" // allow re-selecting the same file
    }
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
            <Label>Category Image</Label>
            <div className="mt-1.5 flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                {imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Category"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      aria-label="Remove image"
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                    <Upload className="h-5 w-5" />
                  </div>
                )}
              </div>
              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm hover:bg-muted transition-colors">
                  <Upload className="h-4 w-4" />
                  {uploading
                    ? "Uploading…"
                    : imageUrl
                      ? "Replace image"
                      : "Upload image"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    disabled={uploading}
                    onChange={handleImageUpload}
                  />
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  PNG, JPG, WEBP or GIF, up to 5MB.
                </p>
              </div>
            </div>
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
