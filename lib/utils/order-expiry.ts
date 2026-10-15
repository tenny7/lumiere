// Which stale `pending` orders must NOT be auto-cancelled (see
// app/api/cron/expire-pending-orders). Kept: anything with a successful
// payment, and orders waiting on the store — Cash on Delivery and MoMo
// transfer record a `manual` payment that stays pending until an admin marks
// it paid. Everything else (no payment at all, a failed payment, or a MoMo app
// request still pending after 24h) is an abandoned checkout.

export type PaymentForExpiry = {
  order_id: string
  status: string
  provider: string
}

export function ordersToKeep(payments: PaymentForExpiry[]): Set<string> {
  return new Set(
    payments
      .filter(
        (p) =>
          p.status === "successful" ||
          (p.provider === "manual" &&
            (p.status === "pending" || p.status === "processing")),
      )
      .map((p) => p.order_id),
  )
}
