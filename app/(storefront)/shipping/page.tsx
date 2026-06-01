export default function ShippingPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
          Delivery Info
        </p>
        <h1 className="font-serif text-4xl lg:text-5xl font-light mb-10">
          Shipping &amp; Returns
        </h1>
        <div className="space-y-8 text-[#c4bdb0] leading-relaxed">
          <section>
            <h2 className="font-serif text-xl text-[#f5f0e8] mb-3">Shipping</h2>
            <ul className="space-y-2 text-sm list-disc list-inside">
              <li>Free delivery on orders over RWF 50,000 within Kigali</li>
              <li>Standard delivery: 2-5 business days (RWF 5,000)</li>
              <li>Express delivery: 1-2 business days (RWF 10,000)</li>
              <li>Nationwide delivery available across Rwanda</li>
            </ul>
          </section>
          <section>
            <h2 className="font-serif text-xl text-[#f5f0e8] mb-3">Returns</h2>
            <ul className="space-y-2 text-sm list-disc list-inside">
              <li>30-day return window for unused items in original packaging</li>
              <li>Damaged items reported within 48 hours qualify for free replacement</li>
              <li>Contact support@ajabulighting.com to initiate a return</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
