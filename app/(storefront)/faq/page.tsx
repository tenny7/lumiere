const faqs = [
  {
    q: "What payment methods do you accept?",
    a: "We accept MTN Mobile Money, Vodafone Cash, and AirtelTigo Money. Simply enter your phone number at checkout and approve the payment on your device.",
  },
  {
    q: "Do you offer installation services?",
    a: "Yes! We partner with certified electricians across Kigali. Installation can be added during checkout or scheduled after delivery.",
  },
  {
    q: "How long does delivery take?",
    a: "Standard delivery within Kigali takes 2-5 business days. Express delivery is available for 1-2 day turnaround. Nationwide shipping is available across Rwanda.",
  },
  {
    q: "Can I return an item?",
    a: "We offer a 30-day return window for unused items in their original packaging. Damaged items can be reported within 48 hours for a free replacement.",
  },
  {
    q: "Do your smart lights work with Google Home / Alexa?",
    a: "Yes, most of our smart lighting products are compatible with major platforms. Check the product specifications for detailed compatibility info.",
  },
  {
    q: "Do you ship outside Rwanda?",
    a: "Currently we deliver nationwide within Rwanda. International shipping is coming soon — sign up for our newsletter to be notified.",
  },
]

export default function FAQPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
          Help Center
        </p>
        <h1 className="font-serif text-4xl lg:text-5xl font-light mb-10">
          Frequently Asked Questions
        </h1>
        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-white/[0.06] pb-6">
              <h3 className="font-serif text-lg text-[#f5f0e8] mb-2">{faq.q}</h3>
              <p className="text-sm text-[#8a8478] leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
