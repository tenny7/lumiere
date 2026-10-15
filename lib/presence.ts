"use client"

import { useEffect, useSyncExternalStore } from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"

// Who's online, for staff (RLS). The server decides with its own clock
// (presence_status(), migration 00021): online while any of the person's
// tabs is open. Changes arrive live: each tab opening, checking in or closing
// (components/presence-heartbeat.tsx) is a Realtime event that triggers a
// re-read. The poll is the backstop for tabs that vanish without a goodbye
// (they expire after 90s) and for missed events.
const POLL_MS = 30_000
// A goodbye still counts as online for 5s (covers page reloads), so look
// again just after that.
const AFTER_LEAVE_MS = 6_000
// Before migration 00021 is applied: per-user heartbeat, online if seen in
// the last 2 minutes.
const LEGACY_ONLINE_WINDOW_MS = 2 * 60_000

type Snapshot = {
  loaded: boolean
  now: number
  lastSeen: Record<string, string | null>
  online: Record<string, boolean>
}

type PresenceRow = {
  user_id: string
  last_seen_at: string | null
  online: boolean
}

// One shared store for every OnlineDot on the page: dots register their user
// ids and a single batched query refreshes them all.
const EMPTY: Snapshot = { loaded: false, now: 0, lastSeen: {}, online: {} }
let snapshot: Snapshot = EMPTY
const SERVER_SNAPSHOT: Snapshot = EMPTY
const listeners = new Set<() => void>()
const ids = new Map<string, number>() // userId -> number of dots using it
let timer: ReturnType<typeof setInterval> | null = null
let pending: ReturnType<typeof setTimeout> | null = null
let afterLeave: ReturnType<typeof setTimeout> | null = null
let channel: RealtimeChannel | null = null

function emit() {
  for (const l of listeners) l()
}

async function fetchPresence(userIds: string[]): Promise<PresenceRow[] | null> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc("presence_status", {
    p_user_ids: userIds,
  })
  if (!error) return (data ?? []) as PresenceRow[]

  // Before migration 00021. Many ids would make the request URL too long; the
  // table holds one small row per user, so for big lists read it whole.
  const query = supabase.from("user_presence").select("user_id, last_seen_at")
  const legacy =
    userIds.length > 50 ? await query : await query.in("user_id", userIds)
  if (legacy.error) return null // e.g. 00017 not applied: leave dots hidden
  const now = Date.now()
  return (legacy.data ?? []).map((r) => ({
    user_id: r.user_id,
    last_seen_at: r.last_seen_at,
    online:
      !!r.last_seen_at &&
      now - new Date(r.last_seen_at).getTime() < LEGACY_ONLINE_WINDOW_MS,
  }))
}

async function refresh() {
  const userIds = [...ids.keys()]
  if (userIds.length === 0) return
  const rows = await fetchPresence(userIds)
  if (!rows) return
  const lastSeen: Record<string, string | null> = {}
  const online: Record<string, boolean> = {}
  for (const id of userIds) {
    lastSeen[id] = null
    online[id] = false
  }
  for (const row of rows) {
    lastSeen[row.user_id] = row.last_seen_at
    online[row.user_id] = row.online
  }
  snapshot = { loaded: true, now: Date.now(), lastSeen, online }
  emit()
}

function scheduleRefresh(delay = 50) {
  if (pending) return
  // Batch every dot that mounts in the same render (and bursts of live
  // events) into one query.
  pending = setTimeout(() => {
    pending = null
    refresh()
  }, delay)
}

function onPresenceEvent() {
  scheduleRefresh(300)
  if (!afterLeave) {
    afterLeave = setTimeout(() => {
      afterLeave = null
      refresh()
    }, AFTER_LEAVE_MS)
  }
}

const onVisible = () => {
  if (document.visibilityState === "visible") scheduleRefresh()
}

async function startLive() {
  const supabase = createClient()
  // The socket must carry the viewer's JWT: postgres_changes only delivers
  // rows the viewer may SELECT under RLS (staff: everyone's sessions).
  try {
    await supabase.realtime.setAuth()
  } catch {
    /* subscribe anyway; the poll still works */
  }
  if (listeners.size === 0 || channel) return
  channel = supabase
    .channel("presence-sessions")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "presence_sessions" },
      onPresenceEvent,
    )
    .subscribe()
}

function stopLive() {
  if (channel) {
    createClient().removeChannel(channel)
    channel = null
  }
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
  if (!timer) {
    timer = setInterval(refresh, POLL_MS)
    document.addEventListener("visibilitychange", onVisible)
    startLive()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
      document.removeEventListener("visibilitychange", onVisible)
      stopLive()
    }
  }
}

export const getPresenceSnapshot = () => snapshot
export const getPresenceServerSnapshot = () => SERVER_SNAPSHOT

/** Track a list of users and read their presence (for lists/sorting). */
export function usePresence(userIds: string[]) {
  const key = userIds.join(",")
  useEffect(() => {
    const untrack = key ? key.split(",").map((id) => trackUser(id)) : []
    return () => untrack.forEach((stop) => stop())
  }, [key])
  return useSyncExternalStore(
    subscribePresence,
    getPresenceSnapshot,
    getPresenceServerSnapshot,
  )
}

export function isOnline(snap: Snapshot, userId: string) {
  return snap.online[userId] === true
}

export function lastSeenLabel(
  lastSeen: string | null | undefined,
  online: boolean,
  now: number,
) {
  if (online) return "Online"
  if (!lastSeen) return "Offline"
  const mins = Math.max(
    0,
    Math.floor((now - new Date(lastSeen).getTime()) / 60_000),
  )
  if (mins < 1) return "Last seen just now"
  if (mins < 60) return `Last seen ${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `Last seen ${hours} h ago`
  const days = Math.floor(hours / 24)
  return `Last seen ${days} day${days === 1 ? "" : "s"} ago`
}
