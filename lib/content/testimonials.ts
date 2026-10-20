import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

export type Testimonial = {
  id: string
  rating: number
  title: string | null
  body: string
  author: string
  productName: string | null
  productSlug: string | null
  verified: boolean
}

// "Jean-Paul Habimana" → "Jean-Paul H."
function shortName(fullName: unknown): string | null {
  if (typeof fullName !== "string") return null
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return null
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0]}.`
}

/**
 * Home page testimonials: the newest approved reviews that have written
 * text, with at least `minRating` stars. Only approved reviews are ever
 * returned; names are shortened and shown only when `showNames` is on.
 */
export async function getTestimonials({
  count,
  minRating,
  showNames,
}: {
  count: number
  minRating: number
  showNames: boolean
}): Promise<Testimonial[]> {
  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from("reviews")
      .select(
        "id, rating, title, body, is_verified_purchase, profile_id, product:products(name, slug)",
      )
      .eq("is_approved", true)
      .gte("rating", minRating)
      .not("body", "is", null)
      .order("created_at", { ascending: false })
      .limit(count * 3)
    if (error || !data) return []

    const withText = data.filter((r) => typeof r.body === "string" && r.body.trim()).slice(0, count)

    let names = new Map<string, string>()
    if (showNames && withText.length > 0) {
      const { data: profiles } = await db
        .from("profiles")
        .select("id, full_name")
        .in(
          "id",
          withText.map((r) => r.profile_id),
        )
      names = new Map(
        (profiles ?? []).flatMap((p) => {
          const n = shortName(p.full_name)
          return n ? [[p.id as string, n] as [string, string]] : []
        }),
      )
    }

    return withText.map((r) => {
      const product = (Array.isArray(r.product) ? r.product[0] : r.product) as
        | { name: string; slug: string }
        | null
      return {
        id: r.id,
        rating: r.rating,
        title: r.title,
        body: (r.body as string).trim(),
        author: (showNames && names.get(r.profile_id)) || "Verified customer",
        productName: product?.name ?? null,
        productSlug: product?.slug ?? null,
        verified: r.is_verified_purchase,
      }
    })
  } catch {
    return []
  }
}
