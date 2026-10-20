import { getContent } from "@/lib/content/server"
import { PageHeading, Paragraphs } from "@/components/storefront/content-blocks"

// Text: Admin → Content → FAQ.
export default async function FAQPage() {
  const c = await getContent("faq")
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeading eyebrow={c.eyebrow} title={c.title} className="mb-10" />
        <div className="space-y-6">
          {c.items.map((faq, i) => (
            <div key={i} className="border-b border-white/[0.06] pb-6">
              <h3 className="font-serif text-lg text-[#f5f0e8] mb-2">{faq.question}</h3>
              <div className="space-y-3 text-sm text-[#8a8478] leading-relaxed">
                <Paragraphs text={faq.answer} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
