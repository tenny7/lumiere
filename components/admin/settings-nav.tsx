"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const tabs = [
  { label: "General", href: "/admin/settings" },
  { label: "Payments", href: "/admin/settings/payments" },
  { label: "Team", href: "/admin/settings/team" },
]

export function SettingsNav() {
  const pathname = usePathname()
  return (
    <div className="flex gap-1 border-b">
      {tabs.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2 text-sm border-b-2 -mb-px transition-colors ${
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
