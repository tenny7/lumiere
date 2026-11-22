// How a customer gets their order (orders.delivery_method, migration 00026).
// Pure, so checkout, the server and emails share the same rules.

export const DELIVERY_METHODS = [
  {
    value: "delivery",
    label: "Deliver to me",
    description: "We deliver to your address.",
  },
  {
    value: "pickup",
    label: "Collect from the shop",
    description: "Pick it up yourself. No delivery fee.",
  },
  {
    value: "self_arranged",
    label: "Arrange my own delivery",
    description: "Send your own rider to collect it. No delivery fee.",
  },
] as const

export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]["value"]

export const DELIVERY_METHOD_VALUES = DELIVERY_METHODS.map((m) => m.value)

export function isDeliveryMethod(v: unknown): v is DeliveryMethod {
  return typeof v === "string" && (DELIVERY_METHOD_VALUES as string[]).includes(v)
}

/** The store delivers, so the order needs an address and pays the fee. */
export function storeDelivers(method: string | null | undefined): boolean {
  return !method || method === "delivery"
}

export function deliveryMethodLabel(method: string | null | undefined): string {
  return DELIVERY_METHODS.find((m) => m.value === method)?.label ?? "Deliver to me"
}

/**
 * Methods checkout offers, from the `delivery_methods` setting (Admin →
 * Settings → Payments). No setting means delivery only, as before.
 */
export function parseDeliveryMethods(value: unknown): DeliveryMethod[] {
  let list: unknown = value
  if (typeof value === "string") {
    try {
      list = JSON.parse(value)
    } catch {
      list = null
    }
  }
  const methods = Array.isArray(list) ? list.filter(isDeliveryMethod) : []
  return methods.length > 0 ? methods : ["delivery"]
}

/**
 * Status wording for orders the customer collects: the existing statuses are
 * reused, so "shipped" reads "Ready for collection" and "delivered" reads
 * "Collected". Returns null when the normal label applies.
 */
export function collectionStatusLabel(
  status: string,
  method: string | null | undefined,
): string | null {
  if (storeDelivers(method)) return null
  if (status === "shipped") return "Ready for collection"
  if (status === "delivered") return "Collected"
  return null
}
