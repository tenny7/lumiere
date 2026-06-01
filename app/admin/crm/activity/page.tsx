import { createClient } from "@/lib/supabase/server"
import { formatDateTime } from "@/lib/utils/format"
import { Badge } from "@/components/ui/badge"
import {
  Package,
  ShoppingCart,
  Ticket,
  FolderTree,
  Settings,
  Users,
  Handshake,
  CheckSquare,
  Contact,
  FileText,
  Activity as ActivityIcon,
} from "lucide-react"

// Icon + accent per entity type
const entityMeta: Record<
  string,
  { icon: React.ElementType; color: string; label: string }
> = {
  products: { icon: Package, color: "text-amber-400", label: "Product" },
  orders: { icon: ShoppingCart, color: "text-cyan-400", label: "Order" },
  coupons: { icon: Ticket, color: "text-pink-400", label: "Coupon" },
  categories: { icon: FolderTree, color: "text-emerald-400", label: "Category" },
  store_settings: { icon: Settings, color: "text-gray-400", label: "Settings" },
  profiles: { icon: Users, color: "text-blue-400", label: "Team" },
  crm_deals: { icon: Handshake, color: "text-violet-400", label: "Deal" },
  crm_tasks: { icon: CheckSquare, color: "text-orange-400", label: "Task" },
  crm_contacts: { icon: Contact, color: "text-teal-400", label: "Contact" },
  crm_interactions: { icon: FileText, color: "text-gray-400", label: "Note" },
}

const actionVariant: Record<string, string> = {
  insert: "text-green-400",
  update: "text-blue-400",
  delete: "text-red-400",
}

export default async function CrmActivityPage() {
  const supabase = await createClient()

  const { data: activities } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Activity Feed</h1>
        <p className="text-sm text-muted-foreground">
          Recent actions across the admin dashboard
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

        <div className="space-y-6">
          {activities?.map((item) => {
            const meta = entityMeta[item.entity_type] || {
              icon: ActivityIcon,
              color: "text-muted-foreground",
              label: item.entity_type,
            }
            const Icon = meta.icon
            return (
              <div key={item.id} className="flex gap-4 relative">
                <div
                  className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center z-10 ${meta.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className="text-[0.55rem]">
                      {meta.label}
                    </Badge>
                    <span
                      className={`text-[0.6rem] font-medium uppercase tracking-wider ${actionVariant[item.action] || "text-muted-foreground"}`}
                    >
                      {item.action}
                    </span>
                  </div>
                  <p className="text-sm">{item.summary}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.actor_name || "System"} &middot;{" "}
                    {formatDateTime(item.created_at)}
                  </p>
                </div>
              </div>
            )
          })}

          {(!activities || activities.length === 0) && (
            <div className="text-center py-12 text-muted-foreground ml-14">
              <p>No activity yet</p>
              <p className="text-sm mt-1">
                Actions across the dashboard — orders, products, coupons,
                settings and more — will appear here.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
