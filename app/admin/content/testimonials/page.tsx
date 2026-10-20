import Link from "next/link"
import { Star } from "lucide-react"
import { ContentEditor } from "@/components/admin/content/content-editor"
import { getContent, getEditorContent } from "@/lib/content/server"
import { getTestimonials } from "@/lib/content/testimonials"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export default async function TestimonialsContentPage() {
  const [{ initial, defaults, updatedAt, tokens }, settings] = await Promise.all([
    getEditorContent("testimonials"),
    getContent("testimonials"),
  ])
  const [shown, pending] = await Promise.all([
    getTestimonials(settings),
    createAdminClient()
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("is_approved", false)
      .then((r) => r.count ?? 0),
  ])

  return (
    <div className="space-y-8">
      <ContentEditor
        sectionKey="testimonials"
        initial={initial as Record<string, unknown>}
        defaults={defaults as Record<string, unknown>}
        updatedAt={updatedAt}
        tokens={tokens}
      />

      <section className="max-w-3xl space-y-3">
        <div>
          <h2 className="text-base font-semibold">On the home page now</h2>
          <p className="text-sm text-muted-foreground">
            The newest approved reviews with written text that match the
            settings above (as last saved).{" "}
            {settings.show ? "" : "Testimonials are switched off, so none are shown. "}
            To add or remove one, approve or hide it in{" "}
            <Link href="/admin/reviews" className="text-amber-600 underline">
              Reviews
            </Link>
            {pending > 0 ? ` (${pending} waiting for approval).` : "."}
          </p>
        </div>
        {shown.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No approved reviews match yet, so the section is hidden on the site.
          </p>
        ) : (
          <ul className="space-y-3">
            {shown.map((t) => (
              <li key={t.id} className="rounded-md border bg-card p-4">
                <div className="mb-1 flex items-center gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${i < t.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"}`}
                    />
                  ))}
                </div>
                <p className="text-sm">&ldquo;{t.body}&rdquo;</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.author}
                  {t.productName ? ` · ${t.productName}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
