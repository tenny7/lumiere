import { createClient } from "@/lib/supabase/server"
import { formatDateTime } from "@/lib/utils/format"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  ShoppingCart,
  AlertTriangle,
  FileText,
  Clock,
} from "lucide-react"

const typeIcons: Record<string, React.ElementType> = {
  note: FileText,
  call: Phone,
  email: Mail,
  sms: MessageSquare,
  meeting: Calendar,
  order: ShoppingCart,
  complaint: AlertTriangle,
  follow_up: Clock,
}

const typeColors: Record<string, string> = {
  note: "text-gray-400",
  call: "text-green-400",
  email: "text-blue-400",
  sms: "text-purple-400",
  meeting: "text-amber-400",
  order: "text-cyan-400",
  complaint: "text-red-400",
  follow_up: "text-orange-400",
}

export default async function CrmActivityPage() {
  const supabase = await createClient()

  const { data: interactions } = await supabase
    .from("crm_interactions")
    .select("*, contact:crm_contacts(full_name), agent:profiles!crm_interactions_agent_id_fkey(full_name)")
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Activity Feed
        </h1>
        <p className="text-sm text-muted-foreground">
          Recent interactions across all contacts
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-6">
          {interactions?.map((interaction) => {
            const Icon = typeIcons[interaction.type] || FileText
            return (
              <div key={interaction.id} className="flex gap-4 relative">
                <div
                  className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center z-10 ${typeColors[interaction.type]}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {interaction.contact?.full_name}
                    </span>
                    <Badge variant="outline" className="text-[0.55rem]">
                      {interaction.type}
                    </Badge>
                  </div>
                  {interaction.subject && (
                    <p className="text-sm mb-0.5">{interaction.subject}</p>
                  )}
                  {interaction.body && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {interaction.body}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {interaction.agent?.full_name || "System"} &middot;{" "}
                    {formatDateTime(interaction.created_at)}
                  </p>
                </div>
              </div>
            )
          })}

          {(!interactions || interactions.length === 0) && (
            <div className="text-center py-12 text-muted-foreground ml-14">
              <p>No activity yet</p>
              <p className="text-sm mt-1">
                Interactions will appear here as your team engages with contacts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
