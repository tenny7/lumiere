import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { can } from "@/lib/permissions"
import {
  BUCKET,
  CACHE_SECONDS,
  optimizeImage,
  type OptimizedImage,
} from "@/lib/images/variants"

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: NextRequest) {
  try {
    // Authenticate and check admin role
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminDb = createAdminClient()

    const { data: profile } = await adminDb
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || !can(profile.role, "catalog")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const productId = formData.get("productId") as string | null
    const altText = (formData.get("altText") as string) || ""

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 },
      )
    }

    if (!productId) {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 },
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 },
      )
    }

    // Verify product exists
    const { data: product } = await adminDb
      .from("products")
      .select("id")
      .eq("id", productId)
      .single()

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 },
      )
    }

    // Build a unique file path
    const ext = file.name.split(".").pop() || "jpg"
    const basePath = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const fileName = `${basePath}.${ext}`

    // Upload to Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await adminDb.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: CACHE_SECONDS,
        upsert: false,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json(
        { error: "Failed to upload image" },
        { status: 500 },
      )
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = adminDb.storage.from(BUCKET).getPublicUrl(fileName)

    // Smaller WebP copies for the storefront. GIFs stay as they are so an
    // animation keeps playing. If this fails the photo still saves, and the
    // storefront shows the original.
    let optimized: OptimizedImage | null = null
    if (file.type !== "image/gif") {
      try {
        optimized = await optimizeImage(adminDb, basePath, buffer)
      } catch (optimizeError) {
        console.error("Image optimize error:", optimizeError)
      }
    }

    // Determine sort order (append after existing images)
    const { count } = await adminDb
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId)

    const sortOrder = (count ?? 0) + 1

    // Insert record in product_images table
    const { data: imageRecord, error: insertError } = await adminDb
      .from("product_images")
      .insert({
        product_id: productId,
        url: publicUrl,
        alt_text: altText,
        sort_order: sortOrder,
        width: optimized?.width ?? null,
        height: optimized?.height ?? null,
        blur_data_url: optimized?.blurDataUrl ?? null,
        variants: optimized?.variants ?? null,
      })
      .select()
      .single()

    if (insertError) {
      console.error("DB insert error:", insertError)
      // Attempt to clean up the uploaded files
      const copies = (optimized?.variants ?? []).map(
        (v) => `${basePath}-${v.width}.webp`,
      )
      await adminDb.storage.from(BUCKET).remove([fileName, ...copies])
      return NextResponse.json(
        { error: "Failed to save image record" },
        { status: 500 },
      )
    }

    return NextResponse.json(imageRecord, { status: 201 })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
