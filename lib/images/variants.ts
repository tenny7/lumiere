import sharp from "sharp"
import type { SupabaseClient } from "@supabase/supabase-js"

// Product photos are uploaded far bigger than they are shown: often
// 1,000-1,500px PNGs over 1 MB, for a card about 300px wide. Each upload also
// gets WebP copies at these widths (never wider than the original), and the
// storefront lets the browser pick one per screen (lib/images/srcset.ts).
//
// Shared by the upload routes and scripts/optimize-product-images.mjs, which
// runs this file directly with Node, so it imports nothing through "@/".
export const BUCKET = "product-images"
export const VARIANT_WIDTHS = [480, 960, 1600]
const WEBP_QUALITY = 78

// File names are unique and never reused, so browsers and the CDN can keep
// them for a year (Supabase's default is an hour).
export const CACHE_SECONDS = "31536000"

export interface ImageVariant {
  width: number
  url: string
  bytes: number
}

export interface OptimizedImage {
  width: number
  height: number
  blurDataUrl: string
  variants: ImageVariant[]
}

/**
 * Makes the WebP copies and a ~100-byte blurred preview of a photo, and stores
 * the copies next to the original as `<basePath>-<width>.webp`. Throws if the
 * photo can't be read or a copy can't be stored; copies already stored are
 * removed first.
 */
export async function optimizeImage(
  db: SupabaseClient,
  basePath: string,
  input: Buffer,
): Promise<OptimizedImage> {
  const meta = await sharp(input).metadata()
  // EXIF orientations 5-8 are rotated a quarter turn, so width and height swap.
  const turned = (meta.orientation ?? 1) >= 5
  const width = (turned ? meta.height : meta.width) ?? 0
  const height = (turned ? meta.width : meta.height) ?? 0

  const copies: { width: number; data: Buffer }[] = []
  for (const target of VARIANT_WIDTHS) {
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: target, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer({ resolveWithObject: true })
    // A photo narrower than this width already has its full-size copy.
    if (copies.some((c) => c.width === info.width)) continue
    copies.push({ width: info.width, data })
  }

  const blur = await sharp(input)
    .rotate()
    .resize(16, 16, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer()

  const storage = db.storage.from(BUCKET)
  const stored: string[] = []
  const variants: ImageVariant[] = []
  try {
    for (const copy of copies) {
      const path = `${basePath}-${copy.width}.webp`
      const { error } = await storage.upload(path, copy.data, {
        contentType: "image/webp",
        cacheControl: CACHE_SECONDS,
        upsert: true,
      })
      if (error) throw error
      stored.push(path)
      variants.push({
        width: copy.width,
        url: storage.getPublicUrl(path).data.publicUrl,
        bytes: copy.data.length,
      })
    }
  } catch (e) {
    if (stored.length > 0) await storage.remove(stored)
    throw e
  }

  return {
    width,
    height,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
    variants,
  }
}

/** A single WebP no wider than `maxWidth`, for photos that need one size. */
export async function toWebp(input: Buffer, maxWidth: number): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}

/** The bucket path of one of its public URLs, or null if it isn't one. */
export function storagePath(publicUrl: string): string | null {
  const prefix = `/storage/v1/object/public/${BUCKET}/`
  const i = publicUrl.indexOf(prefix)
  return i === -1 ? null : decodeURIComponent(publicUrl.slice(i + prefix.length))
}
