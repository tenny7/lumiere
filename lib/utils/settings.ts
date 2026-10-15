import "server-only"
import { cache } from "react"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  parsePricingSettings,
  PRICING_SETTING_KEYS,
  type PricingSettings,
} from "@/lib/utils/pricing"
import {
  parseSocialSettings,
  SOCIAL_SETTING_KEYS,
  type SocialLinks,
} from "@/lib/utils/socials"

/**
 * Delivery fee, free-delivery threshold and VAT rate from Admin → Settings.
 * Deduplicated per request via React cache().
 */
export const getPricingSettings = cache(async (): Promise<PricingSettings> => {
  const adminDb = createAdminClient()
  const { data } = await adminDb
    .from("store_settings")
    .select("key, value")
    .in("key", [...PRICING_SETTING_KEYS])
  return parsePricingSettings(data)
})

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

/**
 * Instagram / Facebook / WhatsApp links from Admin → Settings → Social media.
 * Never throws: on a read error the links are simply not shown.
 * Deduplicated per request via React cache().
 */
export const getSocialLinks = cache(async (): Promise<SocialLinks> => {
  try {
    const adminDb = createAdminClient()
    const { data } = await adminDb
      .from("store_settings")
      .select("key, value")
      .in("key", [...SOCIAL_SETTING_KEYS])
    return parseSocialSettings(data)
  } catch {
    return parseSocialSettings(null)
  }
})
