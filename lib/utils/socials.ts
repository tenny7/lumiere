// Social media links from Admin → Settings. The admin can type a handle, a
// number or paste a full link; these turn it into a link for the storefront.
// Every link points at the network's own domain and only keeps characters a
// handle or number can contain, so the input can't produce another site's
// link or a script URL. Unreadable input returns null (link not shown).

export const SOCIAL_SETTING_KEYS = [
  "social_instagram",
  "social_facebook",
  "social_whatsapp",
] as const

export type SocialLink = { url: string; label: string }

export type SocialLinks = {
  instagram: SocialLink | null
  facebook: SocialLink | null
  whatsapp: SocialLink | null
}

const stripProtocol = (s: string) => s.replace(/^https?:\/\//i, "")

const IG_HANDLE = /^[A-Za-z0-9._]{1,30}$/

/** "@ajabu", "ajabu" or "instagram.com/ajabu/" → instagram.com/ajabu */
export function instagramLink(raw: string | null | undefined): SocialLink | null {
  let s = stripProtocol((raw ?? "").trim())
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
  s = s.split(/[/?#]/)[0]
  if (!IG_HANDLE.test(s)) return null
  return { url: `https://www.instagram.com/${s}/`, label: `@${s}` }
}

const FB_PATH = /^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+){0,3}$/

/**
 * "ajabu", "@ajabu" or any facebook.com Page link (including /p/Name-123 and
 * profile.php?id=123) → facebook.com/…
 */
export function facebookLink(raw: string | null | undefined): SocialLink | null {
  const s = stripProtocol((raw ?? "").trim())
    .replace(/^(www\.|m\.|web\.)?(facebook|fb)\.com\//i, "")
    .replace(/^@/, "")
  const id = s.match(/^profile\.php\?id=(\d{5,20})/i)
  if (id) {
    return {
      url: `https://www.facebook.com/profile.php?id=${id[1]}`,
      label: "Facebook",
    }
  }
  const path = s.split(/[?#]/)[0].replace(/^\/+|\/+$/g, "")
  if (!FB_PATH.test(path)) return null
  const single = !path.includes("/")
  return {
    url: `https://www.facebook.com/${path}`,
    label: single ? path : "Facebook",
  }
}

/**
 * A phone number (any spacing), "wa.me/…" or "api.whatsapp.com/send?phone=…"
 * → wa.me/<digits>. Rwandan numbers without the country code
 * (0788 123 456 or 788 123 456) get +250.
 */
export function whatsappLink(raw: string | null | undefined): SocialLink | null {
  let s = (raw ?? "").trim()
  const fromLink = s.match(/(?:wa\.me\/|phone=)(\+?[\d\s-]+)/i)
  if (fromLink) s = fromLink[1]
  if (/[a-z]/i.test(s)) return null
  let digits = s.replace(/\D/g, "")
  if (s.startsWith("00")) digits = digits.slice(2)
  else if (/^0\d{9}$/.test(digits)) digits = `250${digits.slice(1)}`
  else if (/^7\d{8}$/.test(digits)) digits = `250${digits}`
  if (!/^\d{8,15}$/.test(digits)) return null
  return { url: `https://wa.me/${digits}`, label: formatPhone(digits) }
}

// +250 795 911 841 for Rwandan numbers, otherwise +<digits>.
function formatPhone(digits: string): string {
  const rw = digits.match(/^250(\d{3})(\d{3})(\d{3})$/)
  return rw ? `+250 ${rw[1]} ${rw[2]} ${rw[3]}` : `+${digits}`
}

/** Build the links from store_settings rows (values are JSON strings). */
export function parseSocialSettings(
  rows: { key: string; value: unknown }[] | null | undefined,
): SocialLinks {
  const get = (key: string) => {
    const v = rows?.find((r) => r.key === key)?.value
    return typeof v === "string" ? v : ""
  }
  return {
    instagram: instagramLink(get("social_instagram")),
    facebook: facebookLink(get("social_facebook")),
    whatsapp: whatsappLink(get("social_whatsapp")),
  }
}
