export type UserRole = "customer" | "sales_agent" | "inventory_manager" | "admin" | "super_admin"
export type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
export type PaymentProvider = "momo_mtn" | "momo_vodafone" | "momo_airteltigo" | "manual"
export type PaymentStatus = "pending" | "processing" | "successful" | "failed" | "refunded"
export type CouponType = "percentage" | "fixed_amount" | "free_shipping"
export type CrmContactSource = "website" | "walk_in" | "referral" | "social_media" | "import"
export type CrmContactStatus = "lead" | "prospect" | "active_customer" | "churned" | "vip"
export type CrmInteractionType = "note" | "call" | "email" | "sms" | "meeting" | "order" | "complaint" | "follow_up"
export type CrmTaskPriority = "low" | "medium" | "high" | "urgent"
export type CrmTaskStatus = "todo" | "in_progress" | "done" | "cancelled"
export type CrmDealStatus = "open" | "won" | "lost"

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  email: string
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Address {
  id: string
  profile_id: string
  label: string
  line_1: string
  line_2: string | null
  city: string
  region: string | null
  country: string
  postal_code: string | null
  is_default: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  parent_id: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  long_description: string | null
  category_id: string | null
  sku: string | null
  barcode: string | null
  base_price: number
  sale_price: number | null
  cost_price: number | null
  currency: string
  stock_quantity: number
  low_stock_threshold: number
  is_active: boolean
  is_featured: boolean
  weight: number | null
  dimensions: Record<string, number> | null
  metadata: Record<string, string | number> | null
  created_at: string
  updated_at: string
  // Joined relations
  category?: Category
  images?: ProductImage[]
  variants?: ProductVariant[]
  reviews?: Review[]
}

export interface ProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
}

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku: string | null
  price_adjustment: number
  stock_quantity: number
  attributes: Record<string, string>
}

export interface Order {
  id: string
  order_number: string
  customer_id: string
  status: OrderStatus
  subtotal: number
  discount_amount: number
  delivery_fee: number
  tax_amount: number
  total: number
  currency: string
  shipping_address: Address
  coupon_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // Joined
  customer?: Profile
  items?: OrderItem[]
  payments?: Payment[]
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id: string | null
  product_name: string
  product_sku: string | null
  quantity: number
  unit_price: number
  total_price: number
}

export interface Payment {
  id: string
  order_id: string
  provider: PaymentProvider
  provider_reference: string | null
  phone_number: string | null
  amount: number
  currency: string
  status: PaymentStatus
  provider_metadata: Record<string, unknown>
  initiated_at: string
  completed_at: string | null
}

export interface Coupon {
  id: string
  code: string
  description: string | null
  type: CouponType
  value: number
  min_order_amount: number | null
  max_uses: number | null
  uses_count: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
}

export interface Review {
  id: string
  product_id: string
  profile_id: string
  rating: number
  title: string | null
  body: string | null
  is_verified_purchase: boolean
  is_approved: boolean
  created_at: string
  profile?: Profile
}

export interface CartItem {
  id: string
  profile_id: string
  product_id: string
  variant_id: string | null
  quantity: number
  product?: Product
  variant?: ProductVariant
}

export interface CrmContact {
  id: string
  profile_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  source: CrmContactSource
  status: CrmContactStatus
  lifetime_value: number
  total_orders: number
  assigned_agent_id: string | null
  tags: string[]
  created_at: string
  updated_at: string
  assigned_agent?: Profile
}

export interface CrmInteraction {
  id: string
  contact_id: string
  agent_id: string | null
  type: CrmInteractionType
  subject: string | null
  body: string | null
  metadata: Record<string, unknown>
  created_at: string
  agent?: Profile
}

export interface CrmTask {
  id: string
  contact_id: string | null
  assigned_to: string | null
  title: string
  description: string | null
  priority: CrmTaskPriority
  status: CrmTaskStatus
  due_date: string | null
  created_at: string
  completed_at: string | null
  contact?: CrmContact
  assignee?: Profile
}

export interface CrmPipeline {
  id: string
  name: string
  stages: { name: string; order: number }[]
}

export interface CrmDeal {
  id: string
  contact_id: string
  pipeline_id: string
  title: string
  value: number | null
  currency: string
  stage: string
  probability: number
  expected_close_date: string | null
  assigned_to: string | null
  status: CrmDealStatus
  created_at: string
  updated_at: string
  contact?: CrmContact
  pipeline?: CrmPipeline
  assignee?: Profile
}
