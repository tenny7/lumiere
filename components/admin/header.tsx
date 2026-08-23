"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Bell, Search, Sun, Moon, Volume2 } from "lucide-react"
import { useAdminTheme } from "@/components/admin/admin-theme"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { useNotificationSettings } from "@/hooks/use-notification-settings"
import { playChime } from "@/lib/notification-sound"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { RoleBadge } from "@/components/role-badge"

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function AdminHeader() {
  const router = useRouter()
  const { theme, toggle } = useAdminTheme()
  const [query, setQuery] = useState("")
  const [name, setName] = useState("Admin")
  const [role, setRole] = useState<string | null>(null)
  const [pending, setPending] = useState(0)
  const { settings: notif, update: updateNotif } = useNotificationSettings()

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
      if (profile) setName(profile.username || profile.full_name || "Admin")
      if (profile?.role) setRole(profile.role)

      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
      setPending(count ?? 0)
    }
    load()
  }, [])

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/admin/search?q=${encodeURIComponent(q)}`)
  }

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Search */}
      <form onSubmit={submitSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search orders, products, customers..."
            className="pl-8 h-8 text-sm"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={theme === "dark" ? "Light mode" : "Dark mode"}
          className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Notifications"
            className="relative inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent transition-colors outline-none"
          >
            <Bell className="w-4 h-4" />
            {pending > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-amber-500 text-black text-[0.55rem] font-semibold rounded-full flex items-center justify-center">
                {pending > 9 ? "9+" : pending}
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/admin/orders")}>
              {pending > 0
                ? `${pending} pending order${pending > 1 ? "s" : ""} to review`
                : "No pending orders"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/admin/crm/activity")}>
              View activity feed
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Sound alerts — new orders, reviews, support messages */}
            <div className="px-2 py-1.5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Volume2 className="w-3.5 h-3.5" />
                  Sound alerts
                </span>
                <Switch
                  checked={notif.enabled}
                  onCheckedChange={(v) => {
                    updateNotif({ enabled: v })
                    if (v) playChime(notif.volume)
                  }}
                  aria-label="Toggle notification sound"
                />
              </div>
              {notif.enabled && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={notif.volume}
                  onChange={(e) => updateNotif({ volume: parseFloat(e.target.value) })}
                  onMouseUp={() => playChime(notif.volume)}
                  className="mt-2 w-full accent-amber-500"
                  aria-label="Notification volume"
                />
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 h-8 px-2 rounded-md hover:bg-accent transition-colors">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[0.6rem] bg-amber-500/10 text-amber-500">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm hidden sm:inline">{name}</span>
            <RoleBadge role={role} className="hidden sm:inline-flex" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/account")}>
              My Account
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/admin/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/")}>
              View Store
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={logout}>
              Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
