"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { slugify } from "@/lib/utils/format"
import { PRODUCT_SPECS_KEYS } from "@/lib/utils/constants"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { ProductImageManager } from "@/components/admin/product-image-manager"
import type { Category, Product } from "@/lib/types"

function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={<span />}
          aria-label="More information"
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-help"
        >
          <Info className="w-3.5 h-3.5" />
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])

  const [name, setName] = useState(product?.name || "")
  const [slug, setSlug] = useState(product?.slug || "")
  const [description, setDescription] = useState(product?.description || "")
  const [longDescription, setLongDescription] = useState(product?.long_description || "")
  const [categoryId, setCategoryId] = useState(product?.category_id || "")
  const [sku, setSku] = useState(product?.sku || "")
  const [basePrice, setBasePrice] = useState(product?.base_price?.toString() || "")
  const [salePrice, setSalePrice] = useState(product?.sale_price?.toString() || "")
  const [costPrice, setCostPrice] = useState(product?.cost_price?.toString() || "")
  const [stockQuantity, setStockQuantity] = useState(product?.stock_quantity?.toString() || "0")
  const [lowStockThreshold, setLowStockThreshold] = useState(product?.low_stock_threshold?.toString() || "5")
  const [isActive, setIsActive] = useState(product?.is_active ?? true)
  const [isFeatured, setIsFeatured] = useState(product?.is_featured ?? false)
  const [metadata, setMetadata] = useState<Record<string, string>>(
    (product?.metadata as Record<string, string>) || {},
  )

  useEffect(() => {
    async function loadCategories() {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order")
      if (data) setCategories(data)
    }
    loadCategories()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleNameChange(value: string) {
    setName(value)
    // Auto-generate the slug from the name while creating a new product.
    if (!product) setSlug(slugify(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      name,
      slug,
      description: description || null,
      long_description: longDescription || null,
      category_id: categoryId || null,
      sku: sku || null,
      base_price: parseFloat(basePrice),
      sale_price: salePrice ? parseFloat(salePrice) : null,
      cost_price: costPrice ? parseFloat(costPrice) : null,
      stock_quantity: parseInt(stockQuantity),
      low_stock_threshold: parseInt(lowStockThreshold),
      is_active: isActive,
      is_featured: isFeatured,
      metadata,
    }

    if (product) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product.id)

      if (error) {
        toast.error("Failed to update product")
        setLoading(false)
        return
      }
      toast.success("Product updated")
    } else {
      const { error } = await supabase.from("products").insert(payload)

      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success("Product created")
    }

    router.push("/admin/products")
    router.refresh()
  }

  async function handleDelete() {
    if (!product) return
    if (
      !confirm(
        `Delete "${product.name}"? This cannot be undone. Consider deactivating it instead.`,
      )
    )
      return
    setLoading(true)
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", product.id)
    if (error) {
      toast.error("Failed to delete product")
      setLoading(false)
      return
    }
    toast.success("Product deleted")
    router.push("/admin/products")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main info */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., Aurelia Globe Pendant"
                  required
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="slug" className="flex items-center gap-1.5">
                  Slug
                  <InfoTip text="The product's URL path. Generated automatically from the product name." />
                </Label>
                <Input
                  id="slug"
                  value={slug}
                  readOnly
                  tabIndex={-1}
                  placeholder="auto-generated-from-name"
                  className="bg-muted/40 text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated from the product name.
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Short Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief product description for cards and listings"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="longDescription">Full Description</Label>
              <Textarea
                id="longDescription"
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                placeholder="Detailed product description for the product page"
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="basePrice" className="flex items-center gap-1.5">
                  Base Price (RWF)
                  <InfoTip text="The standard selling price customers pay before any discount. Required." />
                </Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="salePrice" className="flex items-center gap-1.5">
                  Sale Price (RWF)
                  <InfoTip text="Discounted price shown to customers instead of the base price. Leave empty if the product isn't on sale." />
                </Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="Leave empty if not on sale"
                />
              </div>
              <div>
                <Label htmlFor="costPrice" className="flex items-center gap-1.5">
                  Cost Price (RWF)
                  <InfoTip text="What this item costs you to stock. Used for profit/margin reporting only — never shown to customers. Optional." />
                </Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="LUM-CHAN-001"
                />
              </div>
              <div>
                <Label htmlFor="stock">Stock Quantity</Label>
                <Input
                  id="stock"
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="threshold">Low Stock Alert</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              Specifications
              <InfoTip text="All specification fields are optional — fill in only what you know." />
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Optional — leave any you don&apos;t know blank.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {PRODUCT_SPECS_KEYS.map((key) => (
                <div key={key}>
                  <Label htmlFor={key} className="capitalize">
                    {key.replace(/_/g, " ")}
                  </Label>
                  <Input
                    id={key}
                    value={metadata[key] || ""}
                    onChange={(e) =>
                      setMetadata({ ...metadata, [key]: e.target.value })
                    }
                    placeholder={
                      key === "wattage"
                        ? "60W"
                        : key === "lumens"
                          ? "800lm"
                          : key === "color_temperature"
                            ? "2700K"
                            : ""
                    }
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="featured">Featured</Label>
              <Switch
                id="featured"
                checked={isFeatured}
                onCheckedChange={setIsFeatured}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={categoryId} onValueChange={(v) => setCategoryId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {product && <ProductImageManager productId={product.id} />}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading
            ? "Saving..."
            : product
              ? "Update Product"
              : "Create Product"}
        </Button>

        {product && (
          <Button
            type="button"
            variant="outline"
            className="w-full text-red-500 hover:text-red-500"
            disabled={loading}
            onClick={handleDelete}
          >
            Delete Product
          </Button>
        )}
      </div>
    </form>
  )
}
