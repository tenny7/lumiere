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

const ROLES: UserRole[] = [
  "customer",
  "sales_agent",
  "inventory_manager",
  "admin",
  "super_admin",
]

export function RoleSelect({
  userId,
  currentRole,
}: {
  userId: string
  currentRole: UserRole
}) {
  const router = useRouter()
  const [role, setRole] = useState<UserRole>(currentRole)
  const [saving, setSaving] = useState(false)

  async function handleChange(next: UserRole) {
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
      toast.error("Failed to update role")
    } else {
      toast.success("Role updated")
      router.refresh()
    }
    setSaving(false)
  }

  return (
    <Select
      value={role}
      onValueChange={(v) => v && handleChange(v as UserRole)}
      disabled={saving}
    >
      <SelectTrigger className="w-44 h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r} className="capitalize">
            {r.replace(/_/g, " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
