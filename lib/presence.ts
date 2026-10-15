"use client"

import { createClient } from "@/lib/supabase/client"

// A user is "online" if their browser checked in within this window. The
// heartbeat (components/presence-heartbeat.tsx) runs every 60s.
export const ONLINE_WINDOW_MS = 2 * 60_000
const POLL_MS = 30_000

type Snapshot = {
  loaded: boolean
  now: number
  lastSeen: Record<string, string | null>
}

// One shared store for every OnlineDot on the page: dots register their user
// ids and a single batched query refreshes them all.
let snapshot: Snapshot = { loaded: false, now: 0, lastSeen: {} }
const SERVER_SNAPSHOT: Snapshot = { loaded: false, now: 0, lastSeen: {} }
const listeners = new Set<() => void>()
const ids = new Map<string, number>() // userId -> number of dots using it
let timer: ReturnType<typeof setInterval> | null = null
let pending: ReturnType<typeof setTimeout> | null = null

function emit() {
  for (const l of listeners) l()
}

async function refresh() {
  const userIds = [...ids.keys()]
  if (userIds.length === 0) return
  const supabase = createClient()
  const { data, error } = await supabase
    .from("user_presence")
    .select("user_id, last_seen_at")
    .in("user_id", userIds)
  if (error) return // e.g. migration not applied yet: leave dots hidden
  const lastSeen: Record<string, string | null> = {}
  for (const id of userIds) lastSeen[id] = null
  for (const row of data ?? []) lastSeen[row.user_id] = row.last_seen_at
  snapshot = { loaded: true, now: Date.now(), lastSeen }
  emit()
}

function scheduleRefresh() {
  if (pending) return
  // Batch every dot that mounts in the same render into one query.
  pending = setTimeout(() => {
    pending = null
    refresh()
  }, 50)
}

export function trackUser(userId: string) {
  ids.set(userId, (ids.get(userId) ?? 0) + 1)
  scheduleRefresh()
  return () => {
    const n = (ids.get(userId) ?? 1) - 1
    if (n <= 0) ids.delete(userId)
    else ids.set(userId, n)
  }
}

export function subscribePresence(listener: () => void) {
  listeners.add(listener)
  if (!timer) timer = setInterval(refresh, POLL_MS)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

export const getPresenceSnapshot = () => snapshot
export const getPresenceServerSnapshot = () => SERVER_SNAPSHOT

export function isOnline(lastSeen: string | null | undefined, now: number) {
  return !!lastSeen && now - new Date(lastSeen).getTime() < ONLINE_WINDOW_MS
}

export function lastSeenLabel(lastSeen: string | null | undefined, now: number) {
  if (!lastSeen) return "Offline"
  if (isOnline(lastSeen, now)) return "Online"
  const mins = Math.floor((now - new Date(lastSeen).getTime()) / 60_000)
  if (mins < 60) return `Last seen ${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Last seen ${hours} h ago`
  const days = Math.floor(hours / 24)
  return `Last seen ${days} day${days === 1 ? "" : "s"} ago`
}
