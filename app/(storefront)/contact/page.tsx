import { Mail, Phone, MapPin } from "lucide-react"
import { STORE_EMAIL } from "@/lib/utils/constants"
import { getSocialLinks } from "@/lib/utils/settings"
import {
  SocialLinkList,
  hasSocialLinks,
} from "@/components/storefront/social-links"
import { ContactForm } from "./contact-form"

export default async function ContactPage() {
  const socialLinks = await getSocialLinks()

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
          Get In Touch
        </p>
        <h1 className="font-serif text-4xl lg:text-5xl font-light mb-10">
          Contact Us
        </h1>

        <div className="grid gap-6 sm:grid-cols-3 mb-12">
          <div className="border border-white/[0.06] p-6">
            <Mail className="w-5 h-5 text-amber-400 mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-base mb-1">Email</h3>
            <p className="text-sm text-[#8a8478]">{STORE_EMAIL}</p>
          </div>
          <div className="border border-white/[0.06] p-6">
            <Phone className="w-5 h-5 text-amber-400 mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-base mb-1">Phone</h3>
            <p className="text-sm text-[#8a8478]">+250 788 123 456</p>
          </div>
          <div className="border border-white/[0.06] p-6">
            <MapPin className="w-5 h-5 text-amber-400 mb-3" strokeWidth={1.5} />
            <h3 className="font-serif text-base mb-1">Showroom</h3>
            <p className="text-sm text-[#8a8478]">Kimihurura, Kigali</p>
          </div>
        </div>

        {hasSocialLinks(socialLinks) && (
          <div className="mb-12">
            <h2 className="text-[0.65rem] font-medium tracking-[0.2em] uppercase text-[#8a8478] mb-4">
              Chat or follow us
            </h2>
            <SocialLinkList links={socialLinks} variant="buttons" />
          </div>
        )}

        <ContactForm />
      </div>
    </div>
  )
}
