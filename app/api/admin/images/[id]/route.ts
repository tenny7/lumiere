import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

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

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Get the image record
    const { data: image, error: fetchError } = await adminDb
      .from("product_images")
      .select("id, url, product_id")
      .eq("id", id)
      .single()

    if (fetchError || !image) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 },
      )
    }

    // Extract the storage path from the public URL
    // Public URLs have the pattern: .../storage/v1/object/public/product-images/<path>
    const bucketPrefix = "/storage/v1/object/public/product-images/"
    const urlIndex = image.url.indexOf(bucketPrefix)
    if (urlIndex !== -1) {
      const storagePath = decodeURIComponent(
        image.url.slice(urlIndex + bucketPrefix.length),
      )
      const { error: removeError } = await adminDb.storage
        .from("product-images")
        .remove([storagePath])

      if (removeError) {
        console.error("Storage remove error:", removeError)
        // Continue to delete the DB record even if storage removal fails
      }
    }

    // Delete the database record
    const { error: deleteError } = await adminDb
      .from("product_images")
      .delete()
      .eq("id", id)

    if (deleteError) {
      console.error("DB delete error:", deleteError)
      return NextResponse.json(
        { error: "Failed to delete image record" },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Image delete error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
