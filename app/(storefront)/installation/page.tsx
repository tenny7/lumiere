import { getContent } from "@/lib/content/server"
import { PageHeading, Paragraphs } from "@/components/storefront/content-blocks"

// Text: Admin → Content → Installation Guide.
export default async function InstallationPage() {
  const c = await getContent("installation")
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeading eyebrow={c.eyebrow} title={c.title} />
        <div className="space-y-6 text-[#c4bdb0] leading-relaxed">
          <Paragraphs text={c.intro} />
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
