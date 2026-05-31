const designers = [
  {
    name: "Atelier Lumen",
    location: "Paris, France",
    discipline: "Crystal & Brass Chandeliers",
    bio: "A third-generation atelier hand-cutting crystal for grand interiors. Their cascading prism designs anchor our flagship collection.",
  },
  {
    name: "Studio Kintaro",
    location: "Kyoto, Japan",
    discipline: "Paper & Minimal Pendants",
    bio: "Quiet, sculptural pieces inspired by washi paper and shoji screens — diffused light that softens any room.",
  },
  {
    name: "Mara & Sons",
    location: "Kigali, Rwanda",
    discipline: "Woven & Sustainable Fixtures",
    bio: "Local artisans weaving sisal and reclaimed brass into warm, contemporary shades made entirely by hand.",
  },
  {
    name: "Nordlys Works",
    location: "Copenhagen, Denmark",
    discipline: "Smart & Architectural Lighting",
    bio: "Scandinavian engineers blending warm minimalism with app-controlled, energy-efficient LED systems.",
  },
]

export default function DesignersPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-[0.65rem] font-medium tracking-[0.35em] uppercase text-amber-400 mb-3">
          Collaborations
        </p>
        <h1 className="font-serif text-4xl lg:text-5xl font-light mb-8">
          Our Designers
        </h1>
        <p className="text-[#c4bdb0] leading-relaxed mb-12 max-w-3xl">
          We partner with talented lighting designers and artisan studios from
          across the globe. Each collaboration brings a unique perspective to our
          collection, blending traditional craftsmanship with contemporary
          design.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {designers.map((d) => (
            <div key={d.name} className="border border-white/[0.06] p-6">
              <p className="text-[0.6rem] tracking-[0.2em] uppercase text-amber-400 mb-2">
                {d.discipline}
              </p>
              <h2 className="font-serif text-xl mb-1">{d.name}</h2>
              <p className="text-xs text-[#8a8478] mb-4">{d.location}</p>
              <p className="text-sm text-[#c4bdb0] leading-relaxed">{d.bio}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
