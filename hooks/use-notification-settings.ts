"use client"

import { useSyncExternalStore } from "react"

export type NotifSettings = { enabled: boolean; volume: number }
const KEY = "ajabu_admin_notif"
const DEFAULT: NotifSettings = { enabled: true, volume: 0.5 }
const EVENT = "notif-settings:updated"

// Read the latest settings synchronously (used by the realtime handler at the
// moment an event fires, so it always respects the current config).
export function readNotifSettings(): NotifSettings {
  if (typeof window === "undefined") return DEFAULT
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return DEFAULT
}

function subscribe(cb: () => void) {
  window.addEventListener(EVENT, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener("storage", cb)
  }
}
function getSnapshot() {
  try {
    return localStorage.getItem(KEY) ?? ""
  } catch {
    return ""
  }
}
function getServerSnapshot() {
  return ""
}

/** Admin notification-sound settings (per device, in localStorage). */
export function useNotificationSettings() {
  // Subscribe to the raw string (a stable snapshot) via useSyncExternalStore,
  // then parse — avoids a setState-in-effect and is hydration-safe.
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const settings: NotifSettings = raw
    ? { ...DEFAULT, ...safeParse(raw) }
    : DEFAULT

  function update(patch: Partial<NotifSettings>) {
    const next = { ...settings, ...patch }
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(EVENT))
  }

  return { settings, update }
}

function safeParse(raw: string): Partial<NotifSettings> {
  try {
    return JSON.parse(raw)
  } catch {
    return {}
  }
}
