import type { ImageVariant } from "./variants"

// Columns to select from product_images wherever a photo is shown.
export const PRODUCT_IMAGE_COLUMNS =
  "url, alt_text, is_primary, width, height, blur_data_url, variants"

export interface ImageSource {
  url: string
  width?: number | null
  height?: number | null
  blur_data_url?: string | null
  variants?: ImageVariant[] | null
}

/** `srcset` for the WebP copies, or undefined for photos without any. */
export function srcSetFor(image: ImageSource): string | undefined {
  if (!image.variants?.length) return undefined
  return image.variants.map((v) => `${v.url} ${v.width}w`).join(", ")
}

/**
 * The smallest copy at least `minWidth` pixels wide (else the largest), for
 * small fixed-size thumbnails. Falls back to the original.
 */
export function sizedSrc(image: ImageSource, minWidth: number): string {
  const variants = image.variants ?? []
  const fit =
    variants.find((v) => v.width >= minWidth) ?? variants[variants.length - 1]
  return fit?.url ?? image.url
}
