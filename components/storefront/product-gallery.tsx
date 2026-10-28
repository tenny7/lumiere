"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Dialog } from "@base-ui/react/dialog"
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X, ZoomIn } from "lucide-react"
import { ProductImage } from "@/components/storefront/product-image"
import type { ImageSource } from "@/lib/images/srcset"

export type GalleryImage = ImageSource & { id: string; alt_text: string | null }

const MIN_SCALE = 1
const MAX_SCALE = 4
const DOUBLE_TAP_MS = 300

/**
 * The product page photos. Tapping a thumbnail makes it the main photo;
 * tapping the main photo opens a full-screen view to zoom (buttons, wheel,
 * pinch, double-tap), drag around a zoomed photo, and step through the
 * photos (arrows, keys, swipe).
 */
export function ProductGallery({
  images,
  productName,
  badge,
}: {
  images: GalleryImage[]
  productName: string
  /** Shown over the main photo, e.g. the sale percentage. */
  badge?: React.ReactNode
}) {
  const [index, setIndex] = useState(0)
  const [open, setOpen] = useState(false)
  const current = images[index]
  const altFor = (img: GalleryImage) => img.alt_text || productName

  return (
    <div>
      <div className="aspect-square bg-[#1a1918] border border-white/[0.03] relative overflow-hidden mb-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Zoom in on ${altFor(current)}`}
          className="group absolute inset-0 w-full h-full cursor-zoom-in"
        >
          <ProductImage
            // A new key per photo restarts the fade when the photo changes.
            key={current.url}
            image={current}
            alt={altFor(current)}
            sizes="(min-width: 1024px) 600px, 100vw"
            priority={index === 0}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 text-[0.6rem] tracking-[0.2em] uppercase text-[#f5f0e8] opacity-80 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-3.5 h-3.5" />
            Zoom
          </span>
        </button>
        {badge}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-current={i === index}
              className={`aspect-square bg-[#1a1918] border relative overflow-hidden transition-colors ${
                i === index
                  ? "border-amber-500"
                  : "border-white/[0.03] opacity-70 hover:opacity-100 hover:border-amber-500/50"
              }`}
            >
              <ProductImage
                image={img}
                alt=""
                sizes="(min-width: 1024px) 120px, 25vw"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <ZoomViewer
        images={images}
        index={index}
        onIndexChange={setIndex}
        open={open}
        onOpenChange={setOpen}
        altFor={altFor}
      />
    </div>
  )
}

function ZoomViewer({
  images,
  index,
  onIndexChange,
  open,
  onOpenChange,
  altFor,
}: {
  images: GalleryImage[]
  index: number
  onIndexChange: (i: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  altFor: (img: GalleryImage) => string
}) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef({ startX: 0, startY: 0, startView: view, startDistance: 0, moved: false })
  const lastTap = useRef(0)
  const current = images[index]
  // The largest copy is full size for photos up to 1600px, without
  // downloading the original upload.
  const src = current.variants?.length
    ? current.variants[current.variants.length - 1].url
    : current.url

  // Keep a zoomed photo covering the screen: it can move at most as far as it
  // overhangs on each side.
  const clamp = useCallback((scale: number, x: number, y: number) => {
    const img = imgRef.current
    const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
    if (!img || s === 1) return { scale: s, x: 0, y: 0 }
    const maxX = ((s - 1) * img.offsetWidth) / 2
    const maxY = ((s - 1) * img.offsetHeight) / 2
    return {
      scale: s,
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    }
  }, [])

  const zoomTo = useCallback(
    (scale: number) =>
      setView((v) => {
        const ratio = scale / v.scale
        return clamp(scale, v.x * ratio, v.y * ratio)
      }),
    [clamp],
  )

  const go = useCallback(
    (step: number) => onIndexChange((index + step + images.length) % images.length),
    [index, images.length, onIndexChange],
  )

  // Each photo, and each opening, starts unzoomed.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setView({ scale: 1, x: 0, y: 0 })
  }, [index, open])

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const points = [...pointers.current.values()]
    gesture.current = {
      startX: e.clientX,
      startY: e.clientY,
      startView: view,
      startDistance:
        points.length === 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0,
      moved: false,
    }
    setDragging(true)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const g = gesture.current
    const points = [...pointers.current.values()]
    if (points.length === 2 && g.startDistance > 0) {
      // Pinch
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
      const scale = g.startView.scale * (distance / g.startDistance)
      const ratio = scale / g.startView.scale
      setView(clamp(scale, g.startView.x * ratio, g.startView.y * ratio))
      g.moved = true
      return
    }
    const dx = e.clientX - g.startX
    const dy = e.clientY - g.startY
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) g.moved = true
    // Drag a zoomed photo around; unzoomed, a drag is a swipe (on release).
    if (g.startView.scale > 1) setView(clamp(g.startView.scale, g.startView.x + dx, g.startView.y + dy))
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size > 0) return
    setDragging(false)
    const g = gesture.current
    const dx = e.clientX - g.startX
    if (g.startView.scale === 1 && g.startDistance === 0 && Math.abs(dx) > 50 && images.length > 1) {
      go(dx < 0 ? 1 : -1)
      return
    }
    if (!g.moved) {
      // Double tap or double click toggles between fitted and 2.5x.
      const now = Date.now()
      if (now - lastTap.current < DOUBLE_TAP_MS) {
        zoomTo(view.scale > 1 ? 1 : 2.5)
        lastTap.current = 0
      } else {
        lastTap.current = now
      }
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") go(1)
    else if (e.key === "ArrowLeft") go(-1)
    else if (e.key === "+" || e.key === "=") zoomTo(view.scale * 1.5)
    else if (e.key === "-") zoomTo(view.scale / 1.5)
    else if (e.key === "0") zoomTo(1)
    else return
    e.preventDefault()
  }

  const control =
    "w-10 h-10 flex items-center justify-center bg-white/10 text-[#f5f0e8] hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 transition-colors"

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[#0a0a08]" />
        <Dialog.Popup
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-50 flex flex-col text-[#f5f0e8] outline-none"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <Dialog.Title className="text-xs tracking-[0.15em] uppercase text-[#8a8478] truncate pr-4">
              {altFor(current)}
              {images.length > 1 && ` · ${index + 1} / ${images.length}`}
            </Dialog.Title>
            <Dialog.Close aria-label="Close" className={control}>
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div
            className={`relative flex-1 overflow-hidden touch-none select-none ${
              view.scale > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
            }`}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={(e) => zoomTo(view.scale * (e.deltaY < 0 ? 1.2 : 1 / 1.2))}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              key={src}
              src={src}
              alt={altFor(current)}
              draggable={false}
              className={`absolute inset-0 m-auto max-w-full max-h-full ${
                dragging ? "" : "transition-transform duration-200 ease-out"
              }`}
              style={{
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                backgroundImage: current.blur_data_url ? `url("${current.blur_data_url}")` : undefined,
                backgroundSize: "cover",
              }}
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous photo"
                  onClick={() => go(-1)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`${control} absolute left-3 top-1/2 -translate-y-1/2`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next photo"
                  onClick={() => go(1)}
                  onPointerDown={(e) => e.stopPropagation()}
                  className={`${control} absolute right-3 top-1/2 -translate-y-1/2`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 px-4 py-4">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => zoomTo(view.scale / 1.5)}
              disabled={view.scale <= MIN_SCALE}
              className={control}
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="w-14 text-center text-xs tabular-nums text-[#8a8478]">
              {Math.round(view.scale * 100)}%
            </span>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => zoomTo(view.scale * 1.5)}
              disabled={view.scale >= MAX_SCALE}
              className={control}
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Reset zoom"
              onClick={() => zoomTo(1)}
              disabled={view.scale === 1}
              className={`${control} ml-2`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
