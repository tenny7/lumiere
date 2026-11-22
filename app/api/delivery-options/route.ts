import { NextResponse } from "next/server"
import { getDeliveryMethods, getPickupDetails } from "@/lib/orders/pickup"

/** Delivery methods checkout offers, and where to collect an order. */
export async function GET() {
  try {
    const [methods, pickup] = await Promise.all([getDeliveryMethods(), getPickupDetails()])
    return NextResponse.json({ methods, pickup })
  } catch {
    return NextResponse.json({ methods: ["delivery"], pickup: null })
  }
}
