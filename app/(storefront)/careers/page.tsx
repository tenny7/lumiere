import { getContent } from "@/lib/content/server"
import { PageHeading, Paragraphs } from "@/components/storefront/content-blocks"

// Text: Admin → Content → Careers.
export default async function CareersPage() {
  const c = await getContent("careers")
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeading eyebrow={c.eyebrow} title={c.title} />
        <div className="space-y-6 text-[#c4bdb0] leading-relaxed mb-6">
          <Paragraphs text={c.body} />
        </div>
        {c.note && (
          <div className="space-y-3 text-sm text-[#8a8478]">
            <Paragraphs text={c.note} />
          </div>
        )}
      </div>
    </div>
  )
}
