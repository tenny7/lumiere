/**
 * Normalize any international phone number. Accepts an optional leading "+" and
 * any country code, with spaces/dashes/parens. Validates a plausible E.164
 * length (7–15 digits). Returns the display form (keeps a leading "+" if given)
 * and the MSISDN (digits only). Use this for orders that can come from anywhere.
 */
export function normalizeInternationalPhone(
  input: string,
): { display: string; msisdn: string } | null {
  if (!input) return null
  const hasPlus = input.trim().startsWith("+")
  let digits = input.replace(/\D/g, "")
  if (digits.startsWith("00")) digits = digits.slice(2) // 00 intl prefix → drop
  if (digits.length < 7 || digits.length > 15) return null
  return { display: hasPlus ? `+${digits}` : digits, msisdn: digits }
}

/**
 * Normalize a Rwandan mobile number entered in any common form into both the
 * local national format (07XXXXXXXX) and MoMo MSISDN format (2507XXXXXXXX).
 *
 * Accepts: "0781234567", "781234567", "+250 78 123 4567", "250781234567",
 * "00250781234567", with or without spaces, dashes, parentheses.
 * Returns null if it isn't a valid Rwandan mobile number (7[2-9] + 7 digits).
 */
export function normalizeRwandaPhone(
  input: string,
): { national: string; msisdn: string } | null {
  if (!input) return null
  let digits = input.replace(/\D/g, "") // drop +, spaces, dashes, parens

  if (digits.startsWith("00")) digits = digits.slice(2) // intl 00 prefix
  if (digits.startsWith("250")) digits = digits.slice(3) // country code
  else if (digits.startsWith("0")) digits = digits.slice(1) // local trunk 0

  // Subscriber number must be 7 followed by 2-9 then 7 digits (9 total).
  if (!/^7[2-9]\d{7}$/.test(digits)) return null

  return { national: "0" + digits, msisdn: "250" + digits }
}
