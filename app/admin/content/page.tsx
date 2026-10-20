import Link from "next/link"
import { ChevronRight, ExternalLink } from "lucide-react"
import { CONTENT_GROUPS, CONTENT_SECTIONS } from "@/lib/content/sections"
import { getContentUpdatedAt } from "@/lib/content/server"

export const dynamic = "force-dynamic"

export default async function AdminContentPage() {
  const updatedAt = await getContentUpdatedAt()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Content</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Edit the text customers see on the website. Each part of the site has
          its own page; changes go live when you click Save.
        </p>
      </div>

      {CONTENT_GROUPS.map((group) => {
        const sections = CONTENT_SECTIONS.filter((s) => s.group === group)
        return (
          <section key={group} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sections.map((s) => (
                <li key={s.key} className="relative rounded-lg border bg-card transition-colors hover:border-foreground/20">
                  <Link href={`/admin/content/${s.key}`} className="flex h-full items-start gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{s.title}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {updatedAt[s.key]
                          ? `Edited ${new Date(updatedAt[s.key]).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                          : "Original text"}
                      </p>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                  <a
                    href={s.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-3 right-3 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    aria-label={`View ${s.title} on the site`}
                  >
                    {s.path === "/" ? "Home" : s.path}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
