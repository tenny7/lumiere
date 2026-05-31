import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDate } from "@/lib/utils/format"
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

const statusColors: Record<string, string> = {
  lead: "bg-blue-500/10 text-blue-500",
  prospect: "bg-purple-500/10 text-purple-500",
  active_customer: "bg-green-500/10 text-green-500",
  churned: "bg-red-500/10 text-red-500",
  vip: "bg-amber-500/10 text-amber-500",
}

export default async function CrmContactsPage() {
  const supabase = await createClient()

  const { data: contacts } = await supabase
    .from("crm_contacts")
    .select("*, assigned_agent:profiles!crm_contacts_assigned_agent_id_fkey(full_name)")
    .order("updated_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            CRM Contacts
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage leads, prospects, and customer relationships
          </p>
        </div>
        <Button size="sm" render={<Link href="/admin/crm/contacts/new" />}>
          <Plus className="w-4 h-4 mr-2" />
          Add Contact
        </Button>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2">
        {Object.entries(CRM_CONTACT_STATUS_LABELS).map(([key, label]) => (
          <Badge key={key} variant="secondary" className={`cursor-pointer ${statusColors[key]}`}>
            {label}
          </Badge>
        ))}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Lifetime Value</TableHead>
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
                  <Badge
                    variant="secondary"
                    className={`text-[0.6rem] ${statusColors[contact.status]}`}
                  >
                    {CRM_CONTACT_STATUS_LABELS[contact.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{contact.total_orders}</TableCell>
                <TableCell className="text-sm font-medium">
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
                  No contacts yet. They&apos;ll appear here automatically when
                  customers place orders.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
