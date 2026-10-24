"use client"

import { useCallback, useState } from "react"
import { sizedSrc, srcSetFor, type ImageSource } from "@/lib/images/srcset"

/**
 * A product photo that downloads only the size the screen needs, and
 * "switches on": a blurred glow of the photo shows while it loads, then the
 * photo fades up from dim to full brightness. Photos without WebP copies, or
 * whose copy fails to load, use the original file.
 *
 * Fills its parent, which must be `relative` with `overflow-hidden`.
 */
export function ProductImage({
  image,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  image: ImageSource
  alt: string
  /** How wide the photo is shown, e.g. "(min-width: 1024px) 300px, 50vw". */
  sizes: string
  /** Load straight away and first, for the main photo near the top. */
  priority?: boolean
  className?: string
}) {
  // null until the page is interactive: the server HTML shows the photo
  // plainly, so it still appears if scripts are slow. Then false while the
  // photo downloads and true once it has, which starts the fade and hides
  // the glow (it would show through a photo with a transparent background).
  const [loaded, setLoaded] = useState<boolean | null>(null)
  const [failed, setFailed] = useState(false)
  const srcSet = failed ? undefined : srcSetFor(image)

  const watch = useCallback((img: HTMLImageElement | null) => {
    if (img) setLoaded((prev) => (prev === null ? img.complete : prev))
  }, [])

  return (
    <>
      {image.blur_data_url && (
        <span
          aria-hidden="true"
          className={`absolute inset-0 bg-cover bg-center blur-xl scale-110 motion-safe:transition-opacity motion-safe:duration-700 ${
            loaded ? "opacity-0" : ""
          }`}
          style={{ backgroundImage: `url("${image.blur_data_url}")` }}
        />
      )}
      <span
        className={`relative block w-full h-full ${
          loaded === false
            ? "opacity-0 brightness-50"
            : loaded
              ? "motion-safe:transition-[opacity,filter] motion-safe:duration-700 ease-out"
              : ""
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={watch}
          src={srcSet ? sizedSrc(image, 960) : image.url}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={alt}
          width={image.width ?? undefined}
          height={image.height ?? undefined}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (srcSet) setFailed(true)
          }}
          className={className}
        />
      </span>
    </>
  )
}
