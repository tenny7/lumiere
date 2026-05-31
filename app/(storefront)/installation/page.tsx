export default function InstallationPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
          Expert Help
        </p>
        <h1 className="font-serif text-4xl lg:text-5xl font-light mb-8">
          Installation Guide
        </h1>
        <div className="space-y-6 text-[#c4bdb0] leading-relaxed">
          <p>
            Many of our light fixtures can be installed with basic tools and
            electrical knowledge. For complex installations like chandeliers,
            recessed lighting, or outdoor fixtures, we recommend professional
            installation.
          </p>
          <section>
            <h2 className="font-serif text-xl text-[#f5f0e8] mb-3">
              Professional Installation
            </h2>
            <p>
              We partner with certified electricians across Kigali.
              Installation starts at RWF 15,000 per fixture and can be booked
              during checkout or by contacting our support team.
            </p>
          </section>
          <section>
            <h2 className="font-serif text-xl text-[#f5f0e8] mb-3">
              Smart Light Setup
            </h2>
            <p>
              All smart lights come with step-by-step setup guides in the box.
              Our support team is available via WhatsApp to walk you through
              connecting to your home Wi-Fi and preferred smart home platform.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
