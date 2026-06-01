import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils/format"
import { CRM_CONTACT_STATUS_LABELS } from "@/lib/utils/constants"
import { Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Mature, high-contrast status styles for a light admin surface:
// muted tinted background + dark readable text + subtle border + status dot.
const statusStyles: Record<string, { badge: string; dot: string }> = {
  lead: { badge: "bg-slate-100 text-slate-700 border-slate-200", dot: "bg-slate-400" },
  prospect: { badge: "bg-indigo-50 text-indigo-700 border-indigo-200", dot: "bg-indigo-500" },
  active_customer: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  churned: { badge: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500" },
  vip: { badge: "bg-amber-50 text-amber-800 border-amber-200", dot: "bg-amber-500" },
}

function StatusBadge({ status }: { status: string }) {
  const s = statusStyles[status] || statusStyles.lead
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${s.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {CRM_CONTACT_STATUS_LABELS[status] || status}
    </span>
  )
}

export default async function CrmContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status: statusFilter } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("crm_contacts")
    .select(
      "*, assigned_agent:profiles!crm_contacts_assigned_agent_id_fkey(full_name)",
    )
    .order("updated_at", { ascending: false })
    .limit(50)

  if (statusFilter && CRM_CONTACT_STATUS_LABELS[statusFilter]) {
    query = query.eq("status", statusFilter)
  }

  const { data: contacts } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CRM Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Manage leads, prospects, and customer relationships
          </p>
        </div>
        <Button size="sm" render={<Link href="/admin/crm/contacts/new" />}>
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Status filter — functional, mature pills */}
      <div className="flex flex-wrap gap-1.5">
        <Link
          href="/admin/crm/contacts"
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            !statusFilter
              ? "border-foreground bg-foreground text-background"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          }`}
        >
          All
        </Link>
        {Object.entries(CRM_CONTACT_STATUS_LABELS).map(([key, label]) => {
          const active = statusFilter === key
          const s = statusStyles[key]
          return (
            <Link
              key={key}
              href={`/admin/crm/contacts?status=${key}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? s.badge
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {label}
            </Link>
          )
        })}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Lifetime Value</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Tags</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts?.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  <Link
                    href={`/admin/crm/contacts/${contact.id}`}
                    className="font-medium hover:underline"
                  >
                    {contact.full_name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {contact.email || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {contact.phone || "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={contact.status} />
                </TableCell>
                <TableCell className="text-sm text-right tabular-nums">
                  {contact.total_orders}
                </TableCell>
                <TableCell className="text-sm font-medium text-right tabular-nums">
                  {formatCurrency(contact.lifetime_value)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {contact.assigned_agent?.full_name || "Unassigned"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {contact.tags?.slice(0, 3).map((tag: string) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="text-[0.55rem]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!contacts || contacts.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-muted-foreground"
                >
                  {statusFilter
                    ? "No contacts with this status."
                    : "No contacts yet. They'll appear here automatically when customers place orders."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
