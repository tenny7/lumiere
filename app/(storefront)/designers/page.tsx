import { getContent } from "@/lib/content/server"
import { PageHeading, Paragraphs } from "@/components/storefront/content-blocks"

// Text: Admin → Content → Designers.
export default async function DesignersPage() {
  const c = await getContent("designers")
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeading eyebrow={c.eyebrow} title={c.title} />
        {c.intro && (
          <div className="space-y-4 text-[#c4bdb0] leading-relaxed mb-12 max-w-3xl">
            <Paragraphs text={c.intro} />
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          {c.items.map((d, i) => (
            <div key={i} className="border border-white/[0.06] p-6">
              {d.discipline && (
                <p className="text-[0.6rem] tracking-[0.2em] uppercase text-amber-400 mb-2">
                  {d.discipline}
                </p>
              )}
              <h2 className="font-serif text-xl mb-1">{d.name}</h2>
              {d.location && <p className="text-xs text-[#8a8478] mb-4">{d.location}</p>}
              <p className="text-sm text-[#c4bdb0] leading-relaxed">{d.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
