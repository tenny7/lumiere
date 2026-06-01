import { BadgeCheck } from "lucide-react"

/**
 * Gold "Admin" verification badge. Renders only for admin/super_admin roles.
 * Built so other roles (e.g. a future "Verified" customer) can be added later.
 */
export function RoleBadge({
  role,
  className = "",
}: {
  role?: string | null
  className?: string
}) {
  if (role !== "admin" && role !== "super_admin") return null
  return (
    <span
      title="Administrator"
      className={`inline-flex items-center gap-1 rounded-full border border-amber-400/70 bg-gradient-to-b from-amber-50 to-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-amber-700 ${className}`}
    >
      <BadgeCheck className="h-3.5 w-3.5 text-amber-500" strokeWidth={2.25} />
      Admin
    </span>
  )
}
