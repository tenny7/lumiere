"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Review {
  id: string
  rating: number
  title: string | null
  body: string | null
  is_verified_purchase: boolean
  created_at: string
}

export function ProductReviews({
  productId,
  reviews,
}: {
  productId: string
  reviews: Review[]
}) {
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) {
      toast.error("Please select a rating")
      return
    }
    setSubmitting(true)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Please sign in to write a review")
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      profile_id: user.id,
      rating,
      title: title.trim() || null,
      body: body.trim() || null,
    })

    if (error) {
      toast.error(
        error.code === "23505"
          ? "You have already reviewed this product"
          : "Failed to submit review",
      )
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setShowForm(false)
    setRating(0)
    setTitle("")
    setBody("")
    setSubmitting(false)
    toast.success("Thank you! Your review will appear once approved.")
  }

  return (
    <section className="mt-20 border-t border-white/5 pt-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-serif text-2xl font-light">
          Reviews{reviews.length > 0 && ` (${reviews.length})`}
        </h2>
        {!showForm && !submitted && (
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 border border-white/10 text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:border-amber-500/50 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      {submitted && (
        <p className="text-sm text-amber-400 mb-8">
          Thank you! Your review is pending approval.
        </p>
      )}

      {showForm && (
        <form
          onSubmit={submitReview}
          className="mb-12 p-6 border border-white/10 space-y-4"
        >
          <div>
            <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-2 block">
              Rating
            </label>
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const value = i + 1
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHover(value)}
                    onMouseLeave={() => setHover(0)}
                    className="p-0.5"
                    aria-label={`${value} star${value > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`w-6 h-6 transition-colors ${
                        value <= (hover || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-[#242320]"
                      }`}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder="Summarize your experience"
              className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-medium tracking-wider uppercase text-[#8a8478] mb-1.5 block">
              Review
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Tell others what you think"
              className="w-full px-4 py-3 bg-[#1a1918] border border-[#242320] text-sm font-light text-[#f5f0e8] placeholder:text-[#8a8478]/50 outline-none focus:border-amber-500 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-amber-500 text-black text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 border border-white/10 text-[0.72rem] font-medium tracking-[0.2em] uppercase hover:border-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-[#8a8478]">
          No reviews yet. Be the first to share your thoughts.
        </p>
      ) : (
        <div className="space-y-8">
          {reviews.map((review) => (
            <div key={review.id} className="border-b border-white/5 pb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < review.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-[#242320]"
                      }`}
                    />
                  ))}
                </div>
                {review.is_verified_purchase && (
                  <span className="text-[0.6rem] tracking-[0.15em] uppercase text-green-400">
                    Verified Purchase
                  </span>
                )}
                <span className="text-xs text-[#8a8478]/60 ml-auto">
                  {new Date(review.created_at).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              {review.title && (
                <h3 className="text-sm font-medium mb-1">{review.title}</h3>
              )}
              {review.body && (
                <p className="text-sm text-[#8a8478] leading-relaxed">
                  {review.body}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
