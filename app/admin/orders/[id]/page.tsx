import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { formatCurrency, formatDateTime, formatPhone } from "@/lib/utils/format"
import { PAYMENT_STATUS_LABELS, MOMO_PROVIDERS, COD_METHOD_VALUE } from "@/lib/utils/constants"
import { orderStatusLabel, orderStatusColorKey } from "@/lib/utils/order-display"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, User, MapPin, CreditCard, FileText } from "lucide-react"
import { OrderStatusUpdater } from "./status-updater"
import { MarkPaidButton } from "@/components/admin/mark-paid-button"
import { SupportThread, type SupportMessage } from "@/components/support/support-thread"
import { MessageSquare } from "lucide-react"

export const dynamic = "force-dynamic"

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  cod_pending: "bg-green-500/10 text-green-500",
  confirmed: "bg-blue-500/10 text-blue-500",
  processing: "bg-purple-500/10 text-purple-500",
  shipped: "bg-cyan-500/10 text-cyan-500",
  delivered: "bg-green-500/10 text-green-500",
  cancelled: "bg-red-500/10 text-red-500",
  refunded: "bg-gray-500/10 text-gray-500",
}

const paymentColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-500",
  processing: "bg-blue-500/10 text-blue-500",
  successful: "bg-green-500/10 text-green-500",
  failed: "bg-red-500/10 text-red-500",
  refunded: "bg-gray-500/10 text-gray-500",
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from("orders")
    .select(
      "*, customer:profiles(full_name, email, phone), items:order_items(*, product:products(name)), payments(*)"
    )
    .eq("id", id)
    .single()

  if (!order) notFound()

  const { data: supportMessages } = await supabase
    .from("support_messages")
    .select("id, sender_role, body, read_at, created_at")
    .eq("order_id", id)
    .order("created_at", { ascending: true })

  // A customer may have several attempts (e.g. a failed retry then a success).
  // Show the successful one if any, otherwise the most recent attempt.
  const paymentAttempts = [...(order.payments || [])].sort(
    (a, b) =>
      new Date(b.initiated_at).getTime() - new Date(a.initiated_at).getTime(),
  )
  const payment =
    paymentAttempts.find((p) => p.status === "successful") ||
    paymentAttempts[0]
  const address = order.shipping_address as {
    line_1?: string
    line_2?: string
    city?: string
    region?: string
    country?: string
    postal_code?: string
  } | null

  // The raw MoMo response is stored on the payment as provider_metadata. Surface
  // the useful bits so support can explain a complaint and, when it's MTN's
  // side, tell the customer what to quote to MoMo.
  const meta = (payment?.provider_metadata || {}) as {
    method?: string
    financialTransactionId?: string
    reason?: string | { code?: string; message?: string }
    status?: string
    manual?: boolean
  }
  const isCodPayment = meta.method === COD_METHOD_VALUE
  const financialTxnId = meta.financialTransactionId
  const failureReason =
    typeof meta.reason === "string"
      ? meta.reason
      : meta.reason?.message || meta.reason?.code || undefined
  const hasMomoResponse =
    Boolean(payment?.provider_metadata) && !meta.manual && !isCodPayment
  const providerLabel = isCodPayment
    ? "Cash on Delivery"
    : (MOMO_PROVIDERS.find((p) => p.value === payment?.provider)?.label ??
      payment?.provider ??
      "N/A")

  // Admin can update from any non-terminal state (incl. pending, so orders can
  // be advanced manually while MoMo isn't fully wired up).
  const canUpdateStatus = !["refunded"].includes(order.status)

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link
          href="/admin/orders"
          className="hover:text-foreground transition-colors"
        >
          Orders
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium font-mono">
          {order.order_number}
        </span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" render={<Link href="/admin/orders" />}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight font-mono">
              {order.order_number}
            </h1>
            <p className="text-sm text-muted-foreground">
              Placed on {formatDateTime(order.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={
              <a
                href={`/invoice/${order.id}`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <FileText className="w-4 h-4 mr-2" />
            Invoice
          </Button>
          <Badge
            variant="secondary"
            className={`text-[0.6rem] ${statusColors[orderStatusColorKey(order.status, isCodPayment)]}`}
          >
            {orderStatusLabel(order.status, isCodPayment)}
          </Badge>
          {payment && (
            <Badge
              variant="secondary"
              className={`text-[0.6rem] ${paymentColors[payment.status]}`}
            >
              {PAYMENT_STATUS_LABELS[payment.status]}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items?.map((item: {
                      id: string
                      product_name: string
                      product_sku: string | null
                      quantity: number
                      unit_price: number
                      total_price: number
                      product?: { name: string } | null
                    }) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">
                              {item.product?.name ?? item.product_name}
                            </p>
                            {item.product_sku && (
                              <p className="text-xs text-muted-foreground font-mono">
                                {item.product_sku}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.unit_price, order.currency)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(item.total_price, order.currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Order Summary */}
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal, order.currency)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-green-500">
                      -{formatCurrency(order.discount_amount, order.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>
                    {order.delivery_fee > 0
                      ? formatCurrency(order.delivery_fee, order.currency)
                      : "Free"}
                  </span>
                </div>
                {order.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>
                      {formatCurrency(order.tax_amount, order.currency)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2 font-medium">
                  <span>Total</span>
                  <span>{formatCurrency(order.total, order.currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          {payment && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Provider</p>
                    <p className="font-medium">{providerLabel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge
                      variant="secondary"
                      className={`text-[0.6rem] mt-0.5 ${paymentColors[payment.status]}`}
                    >
                      {PAYMENT_STATUS_LABELS[payment.status]}
                    </Badge>
                  </div>
                  {payment.phone_number && (
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium font-mono">
                        {formatPhone(payment.phone_number)}
                      </p>
                    </div>
                  )}
                  {payment.provider_reference && (
                    <div>
                      <p className="text-muted-foreground">Reference</p>
                      <p className="font-medium font-mono text-xs">
                        {payment.provider_reference}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                  </div>
                  {payment.initiated_at && (
                    <div>
                      <p className="text-muted-foreground">Initiated</p>
                      <p className="font-medium">
                        {formatDateTime(payment.initiated_at)}
                      </p>
                    </div>
                  )}
                  {financialTxnId && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">
                        MoMo Transaction ID
                      </p>
                      <p className="font-medium font-mono text-xs break-all">
                        {financialTxnId}
                      </p>
                    </div>
                  )}
                  {failureReason && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">MoMo Reason</p>
                      <p className="font-medium font-mono text-xs text-red-500">
                        {failureReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Support note — what to tell the customer on a complaint. */}
                {payment.status === "failed" && (
                  <div className="mt-4 rounded-md border border-red-500/20 bg-red-500/5 p-3 text-xs text-muted-foreground">
                    This payment failed on MTN&apos;s side
                    {failureReason ? ` (${failureReason})` : ""}. No money was
                    collected. Ask the customer to retry, or — if they were
                    charged — to contact MTN MoMo quoting the reference
                    {financialTxnId ? ` / transaction ID above` : " above"}.
                  </div>
                )}

                {/* Full raw MoMo response, for support / disputes. */}
                {hasMomoResponse && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                      MoMo raw response
                    </summary>
                    <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3 text-[0.7rem] leading-relaxed">
                      {JSON.stringify(payment.provider_metadata, null, 2)}
                    </pre>
                  </details>
                )}
              </CardContent>
            </Card>
          )}

          {/* Support — message the customer about this order */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-xs text-muted-foreground">
                Messages here reach the customer&apos;s inbox and email. Use it to
                explain a payment issue or update them on their order.
              </p>
              <SupportThread
                orderId={order.id}
                role="admin"
                initialMessages={(supportMessages as SupportMessage[]) || []}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Status Update */}
          {canUpdateStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Update Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {payment?.status !== "successful" && (
                  <MarkPaidButton orderId={order.id} />
                )}
                <OrderStatusUpdater
                  orderId={order.id}
                  currentStatus={order.status}
                  trackingNumber={order.tracking_number || ""}
                  trackingCarrier={order.tracking_carrier || ""}
                  trackingUrl={order.tracking_url || ""}
                />
              </CardContent>
            </Card>
          )}

          {/* Customer Info */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order.customer?.full_name}</p>
              <p className="text-muted-foreground">{order.customer?.email}</p>
              {order.customer?.phone && (
                <p className="text-muted-foreground font-mono">
                  {formatPhone(order.customer.phone)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          {address && (
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-base">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>{address.line_1}</p>
                {address.line_2 && <p>{address.line_2}</p>}
                <p>
                  {[address.city, address.region].filter(Boolean).join(", ")}
                </p>
                {address.postal_code && <p>{address.postal_code}</p>}
                <p className="text-muted-foreground">{address.country}</p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
