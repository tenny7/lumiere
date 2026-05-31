import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils/format"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus } from "lucide-react"

export default async function CrmDealsPage() {
  const supabase = await createClient()

  const { data: pipelines } = await supabase
    .from("crm_pipelines")
    .select("*")
    .limit(5)

  const { data: deals } = await supabase
    .from("crm_deals")
    .select("*, contact:crm_contacts(full_name), assignee:profiles!crm_deals_assigned_to_fkey(full_name)")
    .eq("status", "open")
    .order("updated_at", { ascending: false })

  const activePipeline = pipelines?.[0]
  const stages = (activePipeline?.stages as { name: string; order: number }[]) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Deal Pipeline
          </h1>
          <p className="text-sm text-muted-foreground">
            {activePipeline?.name || "No pipeline configured"}
          </p>
        </div>
        <Button size="sm" render={<Link href="/admin/crm/deals/new" />}>
          <Plus className="w-4 h-4 mr-2" />
          New Deal
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const stageDeals = deals?.filter((d) => d.stage === stage.name) || []
          const stageValue = stageDeals.reduce(
            (sum, d) => sum + (d.value || 0),
            0,
          )

          return (
            <div key={stage.name} className="min-w-[280px] flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">{stage.name}</h3>
                <Badge variant="secondary" className="text-[0.6rem]">
                  {stageDeals.length}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {formatCurrency(stageValue)}
              </p>

              <div className="space-y-2">
                {stageDeals.map((deal) => (
                  <Link key={deal.id} href={`/admin/crm/deals/${deal.id}`}>
                    <Card className="cursor-pointer hover:border-primary/30 transition-colors">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium mb-1">{deal.title}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {deal.contact?.full_name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {deal.value ? formatCurrency(deal.value) : "—"}
                        </span>
                        <span className="text-[0.6rem] text-muted-foreground">
                          {deal.probability}%
                        </span>
                      </div>
                      {deal.assignee && (
                        <p className="text-[0.6rem] text-muted-foreground mt-1">
                          {deal.assignee.full_name}
                        </p>
                      )}
                    </CardContent>
                    </Card>
                  </Link>
                ))}

                {stageDeals.length === 0 && (
                  <div className="border border-dashed rounded-lg p-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      No deals
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {stages.length === 0 && (
          <div className="text-center py-12 w-full">
            <p className="text-muted-foreground mb-4">
              No pipeline configured yet
            </p>
            <p className="text-sm text-muted-foreground">
              Run the database migration to seed default pipelines
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
