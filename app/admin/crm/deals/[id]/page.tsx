import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DealForm } from "@/components/admin/deal-form"

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: deal } = await supabase
    .from("crm_deals")
    .select("*")
    .eq("id", id)
    .single()

  if (!deal) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Deal</h1>
        <p className="text-sm text-muted-foreground">{deal.title}</p>
      </div>
      <DealForm deal={deal} />
    </div>
  )
}
