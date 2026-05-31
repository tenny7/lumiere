export default function TermsPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
          Legal
        </p>
        <h1 className="font-serif text-4xl font-light mb-10">Terms of Service</h1>
        <div className="space-y-6 text-sm text-[#c4bdb0] leading-relaxed">
          <p>Last updated: April 2026</p>
          <section>
            <h2 className="font-serif text-xl text-[#f5f0e8] mb-3">General</h2>
            <p>By using lumiere.com you agree to these terms. We reserve the right to update them at any time. Continued use of the site constitutes acceptance of any changes.</p>
          </section>
          <section>
            <h2 className="font-serif text-xl text-[#f5f0e8] mb-3">Orders &amp; Payments</h2>
            <p>All prices are listed in Rwandan Francs (RWF). Payment is processed via MTN Mobile Money. Orders are confirmed once payment is successfully received.</p>
          </section>
          <section>
            <h2 className="font-serif text-xl text-[#f5f0e8] mb-3">Returns</h2>
            <p>Items may be returned within 30 days in their original condition and packaging. See our Shipping &amp; Returns page for full details.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
