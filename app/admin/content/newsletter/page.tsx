import { ContentEditor } from "@/components/admin/content/content-editor"
import { NewsletterComposer } from "@/components/admin/content/newsletter-composer"
import {
  NewsletterSubscribers,
  type Subscriber,
} from "@/components/admin/content/newsletter-subscribers"
import { getEditorContent } from "@/lib/content/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function NewsletterContentPage() {
  const supabase = await createClient()
  const [{ initial, defaults, updatedAt, tokens }, { data }] = await Promise.all([
    getEditorContent("newsletter"),
    // RLS: only admins can read subscribers.
    supabase
      .from("newsletter_subscribers")
      .select("id, email, is_subscribed, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
  ])
  const subscribers = (data ?? []) as Subscriber[]

  return (
    <div className="space-y-8">
      <ContentEditor
        sectionKey="newsletter"
        initial={initial as Record<string, unknown>}
        defaults={defaults as Record<string, unknown>}
        updatedAt={updatedAt}
        tokens={tokens}
      />
      <NewsletterComposer subscriberCount={subscribers.filter((s) => s.is_subscribed).length} />
      <NewsletterSubscribers subscribers={subscribers} />
    </div>
  )
}
