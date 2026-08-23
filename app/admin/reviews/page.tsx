import { createClient } from "@/lib/supabase/server"
import { formatDateTime } from "@/lib/utils/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"
import { ReviewActions } from "@/components/admin/review-actions"

export const dynamic = "force-dynamic"

type ReviewRow = {
  id: string
  rating: number
  title: string | null
  body: string | null
  is_approved: boolean
  is_verified_purchase: boolean
  created_at: string
  product: { name: string } | null
  reviewer: { full_name: string | null; email: string | null } | null
}

function Stars({ n }: { n: number }) {
  return (
    <span className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < n ? "fill-amber-500 text-amber-500" : "text-muted-foreground/40"}`}
        />
      ))}
    </span>
  )
}

function ReviewCard({ r }: { r: ReviewRow }) {
  return (
    <div className="flex flex-col gap-3 border-b p-4 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <Stars n={r.rating} />
          <span className="text-sm font-medium">{r.product?.name ?? "—"}</span>
          {r.is_verified_purchase && (
            <span className="text-[0.6rem] uppercase tracking-wide text-green-600">
              Verified
            </span>
          )}
        </div>
        {r.title && <p className="text-sm font-medium">{r.title}</p>}
        {r.body && <p className="text-sm text-muted-foreground">{r.body}</p>}
        <p className="mt-1 text-xs text-muted-foreground">
          {r.reviewer?.full_name || r.reviewer?.email || "—"} ·{" "}
          {formatDateTime(r.created_at)}
        </p>
      </div>
      <ReviewActions id={r.id} isApproved={r.is_approved} />
    </div>
  )
}

export default async function AdminReviewsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("reviews")
    .select(
      "id, rating, title, body, is_approved, is_verified_purchase, created_at, product:products(name), reviewer:profiles(full_name, email)",
    )
    .order("created_at", { ascending: false })

  const reviews = (data || []) as unknown as ReviewRow[]
  const pending = reviews.filter((r) => !r.is_approved)
  const published = reviews.filter((r) => r.is_approved)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-sm text-muted-foreground">
          Approve reviews to make them visible on the storefront.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Pending approval{pending.length > 0 && ` (${pending.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {pending.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nothing waiting for review.
            </p>
          ) : (
            pending.map((r) => <ReviewCard key={r.id} r={r} />)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Published{published.length > 0 && ` (${published.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {published.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No published reviews yet.
            </p>
          ) : (
            published.map((r) => <ReviewCard key={r.id} r={r} />)
          )}
        </CardContent>
      </Card>
    </div>
  )
}
