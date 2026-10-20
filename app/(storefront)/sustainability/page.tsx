import { getContent } from "@/lib/content/server"
import { PageHeading, Paragraphs } from "@/components/storefront/content-blocks"

// Text: Admin → Content → Sustainability.
export default async function SustainabilityPage() {
  const c = await getContent("sustainability")
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeading eyebrow={c.eyebrow} title={c.title} />
        <div className="space-y-6 text-[#c4bdb0] leading-relaxed">
          <Paragraphs text={c.body} />
        </div>
      </div>
    </div>
  )
}
