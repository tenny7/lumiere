// Who can do what in the admin. One map, used by the route guard (middleware),
// the sidebar, page-level controls and the /api/admin routes. The database
// mirrors these rules in RLS (migration 00019), so they hold even outside the UI.
//
//                     admin/super  sales_agent  inventory_manager
// dashboard, guide         ✓            ✓              ✓
// orders (view)            ✓            ✓              ✓
// orders.manage            ✓            ✓              —   status, Mark as paid
// support, reviews         ✓            ✓              —
// customers (view)         ✓            ✓              —
// catalog                  ✓            —              ✓   products, categories
// finance                  ✓            —              —   revenue figures
// coupons, analytics,
// activity, settings,
// content                  ✓            —              —   website text, newsletter

export type StaffArea =
  | "dashboard"
  | "guide"
  | "search"
  | "orders"
  | "orders.manage"
  | "support"
  | "reviews"
  | "customers"
  | "catalog"
  | "finance"
  | "coupons"
  | "analytics"
  | "activity"
  | "settings"
  | "content"

const ALL: StaffArea[] = [
  "dashboard",
  "guide",
  "search",
  "orders",
  "orders.manage",
  "support",
  "reviews",
  "customers",
  "catalog",
  "finance",
  "coupons",
  "analytics",
  "activity",
  "settings",
  "content",
]

const ROLE_AREAS: Record<string, readonly StaffArea[]> = {
  super_admin: ALL,
  admin: ALL,
  sales_agent: [
    "dashboard",
    "guide",
    "search",
    "orders",
    "orders.manage",
    "support",
    "reviews",
    "customers",
  ],
  inventory_manager: ["dashboard", "guide", "search", "orders", "catalog"],
}

/** Roles that can sign in to the admin at all. */
export const STAFF_ROLES = Object.keys(ROLE_AREAS)

export function isStaffRole(role: string | null | undefined): boolean {
  return !!role && role in ROLE_AREAS
}

export function can(
  role: string | null | undefined,
  area: StaffArea,
): boolean {
  return !!role && (ROLE_AREAS[role]?.includes(area) ?? false)
}

/** The area an /admin URL belongs to (unknown admin pages: admins only). */
export function areaForAdminPath(pathname: string): StaffArea {
  if (pathname === "/admin" || pathname === "/admin/") return "dashboard"
  const prefixes: [string, StaffArea][] = [
    ["/admin/orders", "orders"],
    ["/admin/support", "support"],
    ["/admin/reviews", "reviews"],
    ["/admin/products", "catalog"],
    ["/admin/categories", "catalog"],
    ["/admin/customers", "customers"],
    ["/admin/coupons", "coupons"],
    ["/admin/analytics", "analytics"],
    ["/admin/crm", "activity"],
    ["/admin/settings", "settings"],
    ["/admin/content", "content"],
    ["/admin/guide", "guide"],
    ["/admin/search", "search"],
  ]
  for (const [prefix, area] of prefixes) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return area
  }
  return "settings"
}

/** Human label for a role, e.g. "sales_agent" -> "Sales agent". */
export function roleLabel(role: string): string {
  const s = role.replace(/_/g, " ")
  return s.charAt(0).toUpperCase() + s.slice(1)
}
