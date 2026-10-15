"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { UserRole } from "@/lib/types"
import { EagleBadge } from "@/components/role-badge"

const ROLES: UserRole[] = [
  "customer",
  "sales_agent",
  "inventory_manager",
  "admin",
  "super_admin",
]

const label = (r: string) => r.replace(/_/g, " ")

/**
 * Admin control for a user's role. The database enforces the rules
 * (migration 00016): only admins change roles, nobody changes their own, and
 * only a super admin grants or removes super admin. The UI mirrors them.
 * The Eagle admin (00020) can't be changed by anyone, so it shows a badge.
 */
export function RoleSelect({
  userId,
  currentRole,
  isSelf = false,
  isEagle = false,
  viewerIsSuperAdmin = false,
  onChanged,
  compact = false,
}: {
  userId: string
  currentRole: UserRole
  isSelf?: boolean
  /** The site maintainer's account: never editable from the website. */
  isEagle?: boolean
  viewerIsSuperAdmin?: boolean
  /** Called after the role is saved. */
  onChanged?: (role: UserRole) => void
  /** Smaller trigger for narrow lists (e.g. the Team page sidebar). */
  compact?: boolean
}) {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>(currentRole)
  const [saving, setSaving] = useState(false)

  if (isEagle) return <EagleBadge />

  // Only a super admin can touch a super admin, or grant that role.
  const locked = isSelf || (role === "super_admin" && !viewerIsSuperAdmin)
  const options = viewerIsSuperAdmin
    ? ROLES
    : ROLES.filter((r) => r !== "super_admin")

  async function handleChange(next: UserRole) {
    if (next === role) return
    if (
      (next === "admin" || next === "super_admin") &&
      !window.confirm(
        `Give this person ${label(next)} access? They'll be able to manage orders, products, customers and settings.`,
      )
    ) {
      return
    }

    const prev = role
    setRole(next)
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("profiles")
      .update({ role: next })
      .eq("id", userId)
    if (error) {
      setRole(prev)
      // The database explains why (e.g. "You cannot change your own role").
      toast.error(error.message || "Failed to update role")
    } else {
      toast.success(`Role changed to ${label(next)}`)
      onChanged?.(next)
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <Select
      value={role}
      onValueChange={(v) => v && handleChange(v as UserRole)}
      disabled={saving || locked}
    >
      <SelectTrigger
        className={
          compact
            ? "w-32 h-7 text-[0.7rem] capitalize"
            : "w-44 h-8 text-xs capitalize"
        }
        title={
          isSelf
            ? "You can't change your own role. Ask another admin."
            : locked
              ? "Only a super admin can change this role."
              : undefined
        }
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(options.includes(role) ? options : [...options, role]).map((r) => (
          <SelectItem key={r} value={r} className="capitalize">
            {label(r)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
