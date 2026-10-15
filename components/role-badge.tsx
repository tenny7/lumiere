import { BadgeCheck, Bird } from "lucide-react"

/**
 * Gold "Admin" verification badge. Renders only for admin/super_admin roles.
 * Built so other roles (e.g. a future "Verified" customer) can be added later.
 * `eagle` shows the Eagle admin badge instead (see EagleBadge).
 */
export function RoleBadge({
  role,
  eagle = false,
  className = "",
}: {
  role?: string | null
  eagle?: boolean
  className?: string
}) {
  if (eagle) return <EagleBadge className={className} />
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

/**
 * The site maintainer's account (migration 00020). A super admin that nobody
 * can demote, block or delete from the website.
 */
export function EagleBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Eagle admin: the site maintainer. This account can't be changed or removed from the website."
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-indigo-400/70 bg-gradient-to-b from-indigo-50 to-indigo-100 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-indigo-700 ${className}`}
    >
      <Bird className="h-3.5 w-3.5 text-indigo-500" strokeWidth={2.25} />
      Eagle Admin
    </span>
  )
}
