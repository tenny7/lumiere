import { getContent } from "@/lib/content/server"
import { PageHeading } from "@/components/storefront/content-blocks"

// Text: Admin → Content → Shipping & Returns.
export default async function ShippingPage() {
  const c = await getContent("shipping")
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeading eyebrow={c.eyebrow} title={c.title} className="mb-10" />
        <div className="space-y-8 text-[#c4bdb0] leading-relaxed">
          {c.sections.map((s, i) => (
            <section key={i}>
              {s.heading && (
                <h2 className="font-serif text-xl text-[#f5f0e8] mb-3">{s.heading}</h2>
              )}
              <ul className="space-y-2 text-sm list-disc list-inside">
                {s.points.map((point, j) => (
                  <li key={j}>{point}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
