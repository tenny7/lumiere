import { Mail, Phone, MapPin, ExternalLink } from "lucide-react"
import { getContent } from "@/lib/content/server"
import { getSocialLinks } from "@/lib/utils/settings"
import {
  SocialLinkList,
  hasSocialLinks,
} from "@/components/storefront/social-links"
import { PageHeading, Paragraphs } from "@/components/storefront/content-blocks"
import { ContactForm } from "./contact-form"

// Digits and a leading + only, for a tel: link.
const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`
const isEmail = (v: string) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v)

// Text: Admin → Content → Contact & Showroom. Email and phone default to the
// values in Settings → General; social links come from Settings too.
export default async function ContactPage() {
  const [c, socialLinks] = await Promise.all([getContent("contact"), getSocialLinks()])

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeading eyebrow={c.eyebrow} title={c.title} className={c.intro ? "mb-4" : "mb-10"} />
        {c.intro && (
          <div className="space-y-4 text-[#c4bdb0] leading-relaxed mb-10">
            <Paragraphs text={c.intro} />
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-3 mb-12">
          {c.email && (
            <div className="border border-white/[0.06] p-6">
              <Mail className="w-5 h-5 text-amber-400 mb-3" strokeWidth={1.5} />
              <h3 className="font-serif text-base mb-1">Email</h3>
              {isEmail(c.email) ? (
                <a href={`mailto:${c.email}`} className="text-sm text-[#8a8478] break-all hover:text-amber-400">
                  {c.email}
                </a>
              ) : (
                <p className="text-sm text-[#8a8478] break-all">{c.email}</p>
              )}
            </div>
          )}
          {c.phone && (
            <div className="border border-white/[0.06] p-6">
              <Phone className="w-5 h-5 text-amber-400 mb-3" strokeWidth={1.5} />
              <h3 className="font-serif text-base mb-1">Phone</h3>
              <a href={telHref(c.phone)} className="text-sm text-[#8a8478] hover:text-amber-400">
                {c.phone}
              </a>
            </div>
          )}
          {(c.showroomAddress || c.openingHours.length > 0) && (
            <div className="border border-white/[0.06] p-6">
              <MapPin className="w-5 h-5 text-amber-400 mb-3" strokeWidth={1.5} />
              <h3 className="font-serif text-base mb-1">{c.showroomLabel || "Showroom"}</h3>
              {c.showroomAddress && (
                <p className="text-sm text-[#8a8478] whitespace-pre-line">{c.showroomAddress}</p>
              )}
              {c.openingHours.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-[#8a8478]">
                  {c.openingHours.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              )}
              {c.mapUrl && (
                <a
                  href={c.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-[0.65rem] tracking-[0.15em] uppercase text-amber-400 hover:text-amber-300"
                >
                  Get directions
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}
        </div>

        {hasSocialLinks(socialLinks) && (
          <div className="mb-12">
            {c.socialHeading && (
              <h2 className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#8a8478] mb-4">
                {c.socialHeading}
              </h2>
            )}
            <SocialLinkList links={socialLinks} variant="buttons" />
          </div>
        )}

        <ContactForm />
      </div>
    </div>
  )
}
