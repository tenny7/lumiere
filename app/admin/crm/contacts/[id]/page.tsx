import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ContactForm } from "@/components/admin/contact-form"
import { ContactInteractions } from "@/components/admin/contact-interactions"
import { formatCurrency } from "@/lib/utils/format"
import { Card, CardContent } from "@/components/ui/card"

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contact } = await supabase
    .from("crm_contacts")
    .select("*")
    .eq("id", id)
    .single()

  if (!contact) notFound()

  const { data: interactions } = await supabase
    .from("crm_interactions")
    .select("*")
    .eq("contact_id", id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {contact.full_name}
        </h1>
        <p className="text-sm text-muted-foreground">CRM Contact</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Lifetime Value</p>
            <p className="text-xl font-semibold">
              {formatCurrency(contact.lifetime_value)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Orders</p>
            <p className="text-xl font-semibold">{contact.total_orders}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-xl font-semibold capitalize">
              {contact.status.replace(/_/g, " ")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContactForm contact={contact} />
        <ContactInteractions contactId={id} interactions={interactions || []} />
      </div>
    </div>
  )
}
