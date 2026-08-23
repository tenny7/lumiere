// Instant skeleton shown the moment a storefront link is clicked, so navigation
// feels immediate instead of hanging on the previous page.
export default function Loading() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse">
        <div className="h-4 w-32 bg-white/[0.06] rounded mb-4" />
        <div className="h-10 w-64 bg-white/[0.06] rounded mb-10" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[3/4] bg-white/[0.05] rounded" />
              <div className="h-4 w-3/4 bg-white/[0.06] rounded" />
              <div className="h-3 w-1/2 bg-white/[0.04] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
