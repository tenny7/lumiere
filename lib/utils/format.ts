export function formatCurrency(amount: number, currency = "RWF"): string {
  // RWF (Rwandan Franc) has no minor unit, so show whole francs; other
  // currencies keep 2 decimals. Use the ISO code (e.g. "RWF") rather than the
  // locale symbol ("RF").
  const zeroDecimal = currency === "RWF"
  return new Intl.NumberFormat("en-RW", {
    style: "currency",
    currency,
    currencyDisplay: "code",
    minimumFractionDigits: zeroDecimal ? 0 : 2,
    maximumFractionDigits: zeroDecimal ? 0 : 2,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-RW", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`
  }
  return phone
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export function getStockLabel(quantity: number, threshold: number): { label: string; variant: "success" | "warning" | "destructive" } {
  if (quantity <= 0) return { label: "Out of Stock", variant: "destructive" }
  if (quantity <= threshold) return { label: `Low Stock — ${quantity} left`, variant: "warning" }
  return { label: "In Stock", variant: "success" }
}
