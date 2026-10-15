"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"

export type GuideTocSection = {
  id: string
  title: string
  /** Extra words people might search for ("momo", "refund", "vat"…). */
  keywords?: string
}

/**
 * Admin Guide navigation: sticky list on desktop (highlights the section in
 * view), "Jump to…" select on mobile, and a quick search over titles and
 * keywords.
 */
export function GuideToc({ sections }: { sections: GuideTocSection[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "")
  const [query, setQuery] = useState("")

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (inView[0]) setActive(inView[0].target.id)
      },
      // A section is "current" once its heading passes the top third.
      { rootMargin: "-80px 0px -65% 0px" },
    )
    for (const s of sections) {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    }
    return () => observer.disconnect()
  }, [sections])

  const q = query.trim().toLowerCase()
  const shown = q
    ? sections.filter((s) =>
        `${s.title} ${s.keywords ?? ""}`.toLowerCase().includes(q),
      )
    : sections

  function jump(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
    history.replaceState(null, "", `#${id}`)
  }

  return (
    <>
      {/* Mobile: compact jump menu */}
      <div className="lg:hidden">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Jump to section
        </label>
        <select
          value={active}
          onChange={(e) => jump(e.target.value)}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {/* Desktop: sticky contents with search */}
      <nav
        aria-label="Guide contents"
        className="hidden lg:block lg:sticky lg:top-20 space-y-3"
      >
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the guide"
            className="h-8 w-full rounded-md border bg-background pl-8 pr-2 text-xs outline-none focus:border-amber-500"
          />
        </div>
        <p className="px-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
          On this page
        </p>
        <ul className="max-h-[calc(100vh-12rem)] space-y-0.5 overflow-y-auto">
          {shown.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  jump(s.id)
                }}
                className={`block border-l-2 py-1 pl-3 text-sm transition-colors ${
                  active === s.id
                    ? "border-amber-500 font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.title}
              </a>
            </li>
          ))}
          {shown.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted-foreground">
              No sections match &ldquo;{query}&rdquo;.
            </li>
          )}
        </ul>
      </nav>
    </>
  )
}
