"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { ProductImage } from "@/lib/types"

export function ProductImageManager({ productId }: { productId: string }) {
  const [images, setImages] = useState<ProductImage[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileInput = useRef<HTMLInputElement>(null)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order")
    setImages(data || [])
    setLoading(false)
  }, [productId])

  useEffect(() => {
    // refresh() only calls setState after awaiting the fetch, so this is safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("productId", productId)

    try {
      const res = await fetch("/api/admin/images/upload", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Upload failed")
      } else {
        toast.success("Image uploaded")
        await refresh()
      }
    } catch {
      toast.error("Upload failed")
    }
    setUploading(false)
    if (fileInput.current) fileInput.current.value = ""
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this image?")) return
    try {
      const res = await fetch(`/api/admin/images/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Failed to delete image")
      } else {
        toast.success("Image deleted")
        setImages((imgs) => imgs.filter((i) => i.id !== id))
      }
    } catch {
      toast.error("Failed to delete image")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : images.length === 0 ? (
          <p className="text-sm text-muted-foreground">No images yet.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative group aspect-square bg-muted rounded overflow-hidden border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt_text || ""}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-1 right-1 p-1.5 bg-black/70 rounded text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="Delete image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={uploading}
          onClick={() => fileInput.current?.click()}
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          {uploading ? "Uploading…" : "Upload Image"}
        </Button>
      </CardContent>
    </Card>
  )
}
