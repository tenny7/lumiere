"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type Subscriber = {
  id: string
  email: string
  is_subscribed: boolean
  created_at: string
}

/**
 * Admin → Content → Newsletter: everyone who signed up. Unsubscribing keeps
 * the row (and can be undone); RLS lets only admins read or change it.
 */
export function NewsletterSubscribers({ subscribers }: { subscribers: Subscriber[] }) {
  const router = useRouter()
  const [filter, setFilter] = useState("")
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return q ? subscribers.filter((s) => s.email.includes(q)) : subscribers
  }, [subscribers, filter])
  const active = subscribers.filter((s) => s.is_subscribed)

  async function toggle(s: Subscriber) {
    setBusyId(s.id)
    setError(null)
    const { error } = await createClient()
      .from("newsletter_subscribers")
      .update({ is_subscribed: !s.is_subscribed })
      .eq("id", s.id)
    if (error) setError("Couldn't update. Please try again.")
    else router.refresh()
    setBusyId(null)
  }

  function exportCsv() {
    // A cell starting with = + - @ could run as a formula in Excel.
    const cell = (v: string) => (/^[=+\-@]/.test(v) ? `'${v}` : v)
    const lines = [
      "email,subscribed_on",
      ...active.map((s) => `${cell(s.email)},${s.created_at.slice(0, 10)}`),
    ]
    const blob = new Blob([lines.join("\n")], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="max-w-3xl space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Subscribers</h2>
          <p className="text-sm text-muted-foreground">
            {active.length} subscribed
            {subscribers.length > active.length
              ? `, ${subscribers.length - active.length} unsubscribed`
              : ""}
            .
          </p>
        </div>
        <div className="flex gap-2">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Find an email"
            className="h-8 w-48 text-sm"
            aria-label="Find a subscriber by email"
          />
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={active.length === 0}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Signed up</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Action</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.email}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-sm">
                  {s.is_subscribed ? (
                    <span className="text-green-600 dark:text-green-500">Subscribed</span>
                  ) : (
                    <span className="text-muted-foreground">Unsubscribed</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busyId === s.id}
                    onClick={() => toggle(s)}
                  >
                    {s.is_subscribed ? "Unsubscribe" : "Resubscribe"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                  {subscribers.length === 0 ? "No one has subscribed yet." : "No match."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
