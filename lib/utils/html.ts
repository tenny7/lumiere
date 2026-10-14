/**
 * Escape text for safe insertion into HTML (email bodies, attributes). Use on
 * anything a customer typed before putting it in a template, so it shows as
 * text and can't add links, images or formatting.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
