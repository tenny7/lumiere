import { getContent } from "@/lib/content/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { parseDeliveryMethods, storeDelivers, type DeliveryMethod } from "@/lib/orders/delivery"
import type { CollectionDetails } from "@/lib/emails/render"

export interface PickupDetails {
  /** Shop address, from Admin → Content → Contact & Showroom. */
  address: string
  openingHours: string[]
  mapUrl: string
  /** Extra note from Admin → Settings → Payments, e.g. "Bring your order number". */
  instructions: string
}

/**
 * Where and when customers collect orders. Reuses the showroom details on the
 * Contact page, so the address is kept in one place.
 */
export async function getPickupDetails(): Promise<PickupDetails> {
  const [contact, { data }] = await Promise.all([
    getContent("contact"),
    createAdminClient()
      .from("store_settings")
      .select("value")
      .eq("key", "pickup_instructions")
      .maybeSingle(),
  ])
  return {
    address: contact.showroomAddress?.trim() ?? "",
    openingHours: contact.openingHours ?? [],
    mapUrl: contact.mapUrl ?? "",
    instructions: typeof data?.value === "string" ? data.value.trim() : "",
  }
}

/** Delivery methods checkout offers (Admin → Settings → Payments). */
export async function getDeliveryMethods(): Promise<DeliveryMethod[]> {
  const { data } = await createAdminClient()
    .from("store_settings")
    .select("value")
    .eq("key", "delivery_methods")
    .maybeSingle()
  return parseDeliveryMethods(data?.value)
}

/**
 * Collection details for an order's emails, or null when the store delivers
 * (lib/emails/render.ts shows the shipping address then).
 */
export async function collectionDetailsFor(order: {
  delivery_method?: string | null
  delivery_note?: string | null
}): Promise<CollectionDetails | null> {
  if (storeDelivers(order.delivery_method)) return null
  const pickup = await getPickupDetails().catch(() => null)
  return {
    method: order.delivery_method as string,
    address: pickup?.address ?? "",
    openingHours: pickup?.openingHours ?? [],
    instructions: pickup?.instructions ?? "",
    note: order.delivery_note,
  }
}
