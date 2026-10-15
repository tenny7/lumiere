"use client"

import { useEffect, useSyncExternalStore } from "react"
import {
  trackUser,
  subscribePresence,
  getPresenceSnapshot,
  getPresenceServerSnapshot,
  isOnline,
  lastSeenLabel,
} from "@/lib/presence"

/**
 * Green dot when the user is online, grey when not, with a "Last seen …"
 * tooltip. Staff-only data (RLS). Renders an empty spacer until presence has
 * loaded, so nobody flashes "offline" on page load.
 */
export function OnlineDot({
  userId,
  showLabel = false,
  className = "",
}: {
  userId: string
  showLabel?: boolean
  className?: string
}) {
  useEffect(() => trackUser(userId), [userId])
  const snap = useSyncExternalStore(
    subscribePresence,
    getPresenceSnapshot,
    getPresenceServerSnapshot,
  )

  if (!snap.loaded || !(userId in snap.lastSeen)) {
    return <span aria-hidden className={`inline-block h-2 w-2 ${className}`} />
  }

  const seen = snap.lastSeen[userId]
  const online = isOnline(seen, snap.now)
  const label = lastSeenLabel(seen, snap.now)

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title={label}
    >
      <span
        aria-hidden
        className={`inline-block h-2 w-2 shrink-0 rounded-full ${
          online
            ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.25)]"
            : "bg-neutral-400/60"
        }`}
      />
      <span className={showLabel ? "text-xs text-muted-foreground" : "sr-only"}>
        {label}
      </span>
    </span>
  )
}
