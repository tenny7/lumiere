"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { RoleSelect } from "@/components/admin/role-select"
import { OnlineDot } from "@/components/online-dot"
import type { UserRole } from "@/lib/types"

type Result = {
  id: string
  full_name: string | null
  email: string | null
  role: UserRole
}

/**
 * Team page: find an existing account by name or email and give it a staff
 * role. People must have signed up on the site first. The role change goes
 * through RoleSelect, so the database rules (migration 00016) still apply.
 */
export function AddTeamMember({
  viewerIsSuperAdmin,
}: {
  viewerIsSuperAdmin: boolean
}) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)

  // Characters with meaning in a PostgREST "or" filter (, ( ) " \) or as
  // wildcards (% *) are dropped, so input can't alter the query.
  const term = query.replace(/[,()"\\%*]/g, " ").replace(/\s+/g, " ").trim()

  useEffect(() => {
    if (term.length < 2) return
    let active = true
    const t = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role")
        .eq("role", "customer")
        .or(`email.ilike.%${term}%,full_name.ilike.%${term}%`)
        .order("full_name")
        .limit(8)
      if (active) {
        setResults((data ?? []) as Result[])
        setLoading(false)
      }
    }, 250)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [term])

  const visible = term.length >= 2 ? results : []

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle className="text-base">Add a team member</CardTitle>
        <p className="text-sm text-muted-foreground">
          Search customer accounts by name or email, then choose their role.
          They need to have signed up on the site first.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or email…"
            className="pl-9"
          />
        </div>

        {term.length >= 2 && !loading && visible.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No customer accounts match &ldquo;{term}&rdquo;. Ask them to sign up
            on the site first.
          </p>
        )}

        {visible.length > 0 && (
          <ul className="divide-y rounded-md border">
            {visible.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 p-3"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <OnlineDot userId={p.id} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {p.full_name || p.email}
                    </p>
                    {p.full_name && (
                      <p className="truncate text-xs text-muted-foreground">
                        {p.email}
                      </p>
                    )}
                  </div>
                </div>
                <RoleSelect
                  userId={p.id}
                  currentRole={p.role}
                  viewerIsSuperAdmin={viewerIsSuperAdmin}
                  onChanged={(role) => {
                    // Promoted: they now appear in the team list below.
                    if (role !== "customer") {
                      setResults((rs) => rs.filter((r) => r.id !== p.id))
                    }
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
