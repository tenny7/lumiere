"use client"

import Link from "next/link"
import { useState } from "react"
import { formatDateTime } from "@/lib/utils/format"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageSquare, ArrowUpRight, Search } from "lucide-react"

export type SupportThreadRow = {
  orderId: string
  orderNumber: string
  customer: string
  customerEmail: string
  lastBody: string
  lastAt: string
  unread: number
}

export function SupportThreadList({ threads }: { threads: SupportThreadRow[] }) {
  const [q, setQ] = useState("")
  const query = q.trim().toLowerCase()
  const filtered = query
    ? threads.filter((t) =>
        `${t.orderNumber} ${t.customer} ${t.customerEmail} ${t.lastBody}`
          .toLowerCase()
          .includes(query),
      )
    : threads

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by order, customer, or message…"
          className="pl-9"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {threads.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No customer conversations yet.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No conversations match &ldquo;{q}&rdquo;.
            </p>
          ) : (
            <ul className="divide-y">
              {filtered.map((t) => (
                <li key={t.orderId}>
                  <Link
                    href={`/admin/support/${t.orderId}`}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">
                          {t.orderNumber}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {t.customer}
                        </span>
                        {t.unread > 0 && (
                          <span className="inline-flex items-center justify-center rounded-full bg-amber-500 text-black text-[0.6rem] font-semibold px-2 py-0.5">
                            {t.unread} new
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {t.lastBody}
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        {formatDateTime(t.lastAt)}
                      </p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
