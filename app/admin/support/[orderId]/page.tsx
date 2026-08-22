import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency } from "@/lib/utils/format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText } from "lucide-react"
import { SupportThread, type SupportMessage } from "@/components/support/support-thread"

export const dynamic = "force-dynamic"

export default async function AdminSupportChatPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, order_number, total, currency, status, customer:profiles(full_name, email), payments(status, provider_metadata, initiated_at)",
    )
    .eq("id", orderId)
    .single()
  if (!order) notFound()

  const customer = order.customer as unknown as {
    full_name: string | null
    email: string | null
  } | null

  // Latest payment for context (reason / transaction id).
  const payments = [...((order.payments as unknown as Array<{
    status: string
    provider_metadata: unknown
    initiated_at: string
  }>) || [])].sort(
    (a, b) =>
      new Date(b.initiated_at).getTime() - new Date(a.initiated_at).getTime(),
  )
  const latestPayment =
    payments.find((p) => p.status === "successful") || payments[0]
  const meta = (latestPayment?.provider_metadata || {}) as {
    reason?: string | { code?: string; message?: string }
    financialTransactionId?: string
  }
  const reason =
    typeof meta.reason === "string"
      ? meta.reason
      : meta.reason?.message || meta.reason?.code

  const { data: rows } = await supabase
    .from("support_messages")
    .select("id, sender_role, body, read_at, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(31)
  const hasMore = (rows || []).length > 30
  const page = (hasMore ? (rows || []).slice(0, 30) : rows || []).reverse()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/support" className="hover:text-foreground transition-colors">
          Support
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium font-mono">
          {order.order_number}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" render={<Link href="/admin/support" />}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight font-mono">
              {order.order_number}
            </h1>
            <p className="text-sm text-muted-foreground">
              {customer?.full_name || customer?.email || "—"} ·{" "}
              {formatCurrency(order.total, order.currency)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {latestPayment && (
            <Badge variant="secondary" className="text-[0.6rem]">
              Payment: {latestPayment.status}
              {reason ? ` · ${reason}` : ""}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/admin/orders/${order.id}`} />}
          >
            <FileText className="w-4 h-4 mr-2" />
            Full order
          </Button>
        </div>
      </div>

      {meta.financialTransactionId && (
        <p className="text-xs text-muted-foreground">
          MoMo transaction ID:{" "}
          <span className="font-mono">{meta.financialTransactionId}</span>
        </p>
      )}

      <SupportThread
        orderId={order.id}
        role="admin"
        initialMessages={page as SupportMessage[]}
        initialHasMore={hasMore}
      />
    </div>
  )
}
