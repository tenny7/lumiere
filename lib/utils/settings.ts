import "server-only"
import { cache } from "react"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Read the store's configured currency (Admin → Settings → store_currency).
 * Falls back to RWF. Deduplicated per request via React cache().
 */
export const getStoreCurrency = cache(async (): Promise<string> => {
  try {
    const adminDb = createAdminClient()
    const { data } = await adminDb
      .from("store_settings")
      .select("value")
      .eq("key", "store_currency")
      .maybeSingle()

    // value is JSONB — typically the string "RWF" (or an object for legacy rows).
    const raw = data?.value
    const currency = typeof raw === "string" ? raw : undefined
    return (currency || "RWF").toUpperCase()
  } catch {
    return "RWF"
  }
})
