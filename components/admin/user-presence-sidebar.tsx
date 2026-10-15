"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { RoleSelect } from "@/components/admin/role-select"
import { usePresence, isOnline, lastSeenLabel } from "@/lib/presence"
import type { UserRole } from "@/lib/types"

type SidebarUser = {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
}

/**
 * Team page sidebar: every account with live online status, online first,
 * then most recently seen. Admins can change roles inline.
 */
export function UserPresenceSidebar({
  users,
  viewerId,
  viewerIsAdmin,
  viewerIsSuperAdmin,
}: {
  users: SidebarUser[]
  viewerId: string | null
  viewerIsAdmin: boolean
  viewerIsSuperAdmin: boolean
}) {
  const [filter, setFilter] = useState("")
  const [onlineOnly, setOnlineOnly] = useState(false)
  const snap = usePresence(users.map((u) => u.id))

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase()
    return users
      .map((u) => {
        const seen = snap.lastSeen[u.id] ?? null
        return {
          ...u,
          seen,
          online: isOnline(seen, snap.now),
          seenMs: seen ? new Date(seen).getTime() : 0,
        }
      })
      .filter(
        (u) =>
          (!q ||
            (u.full_name ?? "").toLowerCase().includes(q) ||
            (u.email ?? "").toLowerCase().includes(q)) &&
          (!onlineOnly || u.online),
      )
      .sort(
        (a, b) =>
          Number(b.online) - Number(a.online) ||
          b.seenMs - a.seenMs ||
          (a.full_name ?? a.email ?? "").localeCompare(
            b.full_name ?? b.email ?? "",
          ),
      )
  }, [users, snap, filter, onlineOnly])

  const onlineCount = snap.loaded
    ? users.filter((u) => isOnline(snap.lastSeen[u.id], snap.now)).length
    : null

  return (
    <aside className="rounded-lg border bg-card lg:sticky lg:top-20">
      <div className="space-y-3 border-b p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold">All users</h2>
          <span className="text-xs text-muted-foreground">
            {users.length}
            {onlineCount !== null && (
              <>
                {" · "}
                <span className="text-emerald-500">{onlineCount} online</span>
              </>
            )}
          </span>
        </div>
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by name or email"
          className="h-8 text-xs"
        />
        <div className="flex gap-1.5">
          {[
            { label: "All", value: false },
            { label: "Online", value: true },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setOnlineOnly(opt.value)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                onlineOnly === opt.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="max-h-[65vh] divide-y overflow-y-auto">
        {rows.map((u) => (
          <li key={u.id} className="flex items-center gap-2.5 px-4 py-2.5">
            <span
              title={snap.loaded ? lastSeenLabel(u.seen, snap.now) : undefined}
              aria-label={snap.loaded ? lastSeenLabel(u.seen, snap.now) : undefined}
              className={`h-2 w-2 shrink-0 rounded-full ${
                !snap.loaded
                  ? "bg-transparent"
                  : u.online
                    ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]"
                    : "bg-neutral-400/60"
              }`}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                {u.full_name || u.email}
                {u.id === viewerId && (
                  <span className="text-xs text-muted-foreground"> (you)</span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {snap.loaded ? lastSeenLabel(u.seen, snap.now) : u.email}
              </p>
            </div>
            {viewerIsAdmin ? (
              <RoleSelect
                // Remount when the role changes elsewhere (e.g. team table).
                key={`${u.id}:${u.role}`}
                compact
                userId={u.id}
                currentRole={u.role}
                isSelf={u.id === viewerId}
                viewerIsSuperAdmin={viewerIsSuperAdmin}
              />
            ) : (
              <span className="shrink-0 text-xs capitalize text-muted-foreground">
                {u.role.replace(/_/g, " ")}
              </span>
            )}
          </li>
        ))}
        {rows.length === 0 && (
          <li className="px-4 py-6 text-center text-xs text-muted-foreground">
            {onlineOnly ? "Nobody is online right now." : "No users match."}
          </li>
        )}
      </ul>
    </aside>
  )
}
