import type { LucideIcon } from "lucide-react"
import { ArrowRight, Info, Lightbulb, TriangleAlert } from "lucide-react"

// Presentational building blocks for the Admin Guide page. Server-safe (no
// hooks) and themed with the admin's design tokens, so they follow light/dark.

/** One guide section with an anchor for the table of contents. */
export function GuideSection({
  id,
  icon: Icon,
  title,
  summary,
  children,
}: {
  id: string
  icon: LucideIcon
  title: string
  summary: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      <header className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500/15 text-amber-500">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{summary}</p>
        </div>
      </header>
      <div className="space-y-5 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

/** A sub-heading inside a section. */
export function GuideH3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold">{children}</h3>
}

/** Reference to an on-screen label or button, e.g. <UI>Mark Paid</UI>. */
export function UI({ children }: { children: React.ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded border bg-muted px-1.5 py-0.5 text-[0.8em] font-medium text-foreground">
      {children}
    </span>
  )
}

/** Numbered how-to steps. */
export function Steps({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-500 text-xs font-semibold text-black">
            {i + 1}
          </span>
          <div className="pt-0.5">{item}</div>
        </li>
      ))}
    </ol>
  )
}

/** Plain bullet list. */
export function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5 marker:text-muted-foreground">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

const CALLOUT = {
  tip: {
    icon: Lightbulb,
    cls: "border-emerald-500/40 bg-emerald-500/5",
    iconCls: "text-emerald-500",
  },
  info: {
    icon: Info,
    cls: "border-sky-500/40 bg-sky-500/5",
    iconCls: "text-sky-500",
  },
  warning: {
    icon: TriangleAlert,
    cls: "border-amber-500/50 bg-amber-500/5",
    iconCls: "text-amber-500",
  },
} as const

/** Highlighted tip / info / warning box. */
export function Callout({
  tone,
  title,
  children,
}: {
  tone: keyof typeof CALLOUT
  title: string
  children: React.ReactNode
}) {
  const c = CALLOUT[tone]
  const Icon = c.icon
  return (
    <div className={`flex gap-3 rounded-lg border-l-4 border p-4 ${c.cls}`}>
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${c.iconCls}`} />
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

/** Simple responsive table (scrolls sideways on small screens). */
export function InfoTable({
  head,
  rows,
}: {
  head: string[]
  rows: React.ReactNode[][]
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={i} className="align-top">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`px-3 py-2.5 ${j === 0 ? "font-medium" : "text-muted-foreground"}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** A left-to-right chain of states, e.g. the order lifecycle. */
export function Flow({
  steps,
}: {
  steps: { label: string; note?: string }[]
}) {
  return (
    <div className="flex flex-wrap items-stretch gap-2">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-center gap-2">
          <div className="rounded-lg border bg-card px-3 py-2">
            <p className="text-sm font-semibold capitalize">{s.label}</p>
            {s.note && (
              <p className="text-xs text-muted-foreground">{s.note}</p>
            )}
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
        </div>
      ))}
    </div>
  )
}
