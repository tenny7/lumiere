import { getContent } from "@/lib/content/server"
import { PageHeading, Paragraphs } from "@/components/storefront/content-blocks"

// Text: Admin → Content → Terms of Service.
export default async function TermsPage() {
  const c = await getContent("terms")
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeading eyebrow={c.eyebrow} title={c.title} size="md" className="mb-10" />
        <div className="space-y-6 text-sm text-[#c4bdb0] leading-relaxed">
          {c.lastUpdated && <p>{c.lastUpdated}</p>}
          {c.sections.map((s, i) => (
            <section key={i}>
              {s.heading && (
                <h2 className="font-serif text-xl text-[#f5f0e8] mb-3">{s.heading}</h2>
              )}
              <div className="space-y-3">
                <Paragraphs text={s.body} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
