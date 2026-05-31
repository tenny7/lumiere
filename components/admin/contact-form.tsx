"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  CrmContact,
  CrmContactSource,
  CrmContactStatus,
  Profile,
} from "@/lib/types"

const SOURCES: CrmContactSource[] = [
  "website",
  "walk_in",
  "referral",
  "social_media",
  "import",
]
const STATUSES: CrmContactStatus[] = [
  "lead",
  "prospect",
  "active_customer",
  "churned",
  "vip",
]

export function ContactForm({ contact }: { contact?: CrmContact }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [agents, setAgents] = useState<Pick<Profile, "id" | "full_name">[]>([])

  const [fullName, setFullName] = useState(contact?.full_name || "")
  const [email, setEmail] = useState(contact?.email || "")
  const [phone, setPhone] = useState(contact?.phone || "")
  const [source, setSource] = useState<CrmContactSource>(
    contact?.source || "website",
  )
  const [status, setStatus] = useState<CrmContactStatus>(
    contact?.status || "lead",
  )
  const [agentId, setAgentId] = useState(contact?.assigned_agent_id || "")
  const [tags, setTags] = useState((contact?.tags || []).join(", "))

  useEffect(() => {
    async function loadAgents() {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .neq("role", "customer")
        .order("full_name")
      if (data) setAgents(data)
    }
    loadAgents()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      source,
      status,
      assigned_agent_id: agentId || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    }

    if (contact) {
      const { error } = await supabase
        .from("crm_contacts")
        .update(payload)
        .eq("id", contact.id)
      if (error) {
        toast.error("Failed to update contact")
        setLoading(false)
        return
      }
      toast.success("Contact updated")
      router.refresh()
    } else {
      const { error } = await supabase.from("crm_contacts").insert(payload)
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success("Contact created")
      router.push("/admin/crm/contacts")
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="source">Source</Label>
              <Select
                value={source}
                onValueChange={(v) =>
                  setSource((v as CrmContactSource) ?? "website")
                }
              >
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus((v as CrmContactStatus) ?? "lead")
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="agent">Assigned Agent</Label>
              <Select
                value={agentId || "unassigned"}
                onValueChange={(v) =>
                  setAgentId(v === "unassigned" ? "" : (v ?? ""))
                }
              >
                <SelectTrigger id="agent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="interior-designer, bulk-buyer"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : contact ? "Update Contact" : "Create Contact"}
      </Button>
    </form>
  )
}
