export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  successful: "Successful",
  failed: "Failed",
  refunded: "Refunded",
}

export const MOMO_PROVIDERS = [
  { value: "momo_mtn", label: "MTN Mobile Money", color: "#ffcc00" },
  { value: "momo_vodafone", label: "Vodafone Cash", color: "#e60000" },
  { value: "momo_airteltigo", label: "AirtelTigo Money", color: "#ff3333" },
] as const

export const CRM_CONTACT_STATUS_LABELS: Record<string, string> = {
  lead: "Lead",
  prospect: "Prospect",
  active_customer: "Active Customer",
  churned: "Churned",
  vip: "VIP",
}

export const CRM_TASK_PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
}

export const PRODUCT_SPECS_KEYS = [
  "wattage",
  "lumens",
  "color_temperature",
  "voltage",
  "bulb_type",
  "material",
  "finish",
  "ip_rating",
  "dimmable",
  "smart_enabled",
] as const
