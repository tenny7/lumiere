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
import type { CrmDeal, CrmDealStatus, CrmPipeline } from "@/lib/types"

const STATUSES: CrmDealStatus[] = ["open", "won", "lost"]

export function DealForm({ deal }: { deal?: CrmDeal }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([])
  const [contacts, setContacts] = useState<{ id: string; full_name: string }[]>(
    [],
  )
  const [agents, setAgents] = useState<{ id: string; full_name: string }[]>([])

  const [title, setTitle] = useState(deal?.title || "")
  const [contactId, setContactId] = useState(deal?.contact_id || "")
  const [pipelineId, setPipelineId] = useState(deal?.pipeline_id || "")
  const [stage, setStage] = useState(deal?.stage || "")
  const [value, setValue] = useState(deal?.value?.toString() || "")
  const [probability, setProbability] = useState(
    deal?.probability?.toString() || "0",
  )
  const [expectedClose, setExpectedClose] = useState(deal?.expected_close_date || "")
  const [assignedTo, setAssignedTo] = useState(deal?.assigned_to || "")
  const [status, setStatus] = useState<CrmDealStatus>(deal?.status || "open")

  useEffect(() => {
    async function load() {
      const [{ data: p }, { data: c }, { data: a }] = await Promise.all([
        supabase.from("crm_pipelines").select("*"),
        supabase
          .from("crm_contacts")
          .select("id, full_name")
          .order("full_name")
          .limit(200),
        supabase
          .from("profiles")
          .select("id, full_name")
          .neq("role", "customer")
          .order("full_name"),
      ])
      setPipelines(p || [])
      setContacts(c || [])
      setAgents(a || [])
      // Default to first pipeline / first stage when creating.
      if (!deal && p && p.length > 0) {
        setPipelineId((prev) => prev || p[0].id)
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedPipeline = pipelines.find((p) => p.id === pipelineId)
  const stages = selectedPipeline?.stages || []

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!contactId) {
      toast.error("Please choose a contact")
      return
    }
    if (!pipelineId || !stage) {
      toast.error("Please choose a pipeline and stage")
      return
    }
    setLoading(true)

    const payload = {
      title,
      contact_id: contactId,
      pipeline_id: pipelineId,
      stage,
      value: value ? parseFloat(value) : null,
      probability: parseInt(probability) || 0,
      expected_close_date: expectedClose || null,
      assigned_to: assignedTo || null,
      status,
    }

    if (deal) {
      const { error } = await supabase
        .from("crm_deals")
        .update(payload)
        .eq("id", deal.id)
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success("Deal updated")
    } else {
      const { error } = await supabase.from("crm_deals").insert(payload)
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success("Deal created")
    }

    router.push("/admin/crm/deals")
    router.refresh()
  }

  async function handleDelete() {
    if (!deal) return
    if (!confirm(`Delete deal "${deal.title}"?`)) return
    setLoading(true)
    const { error } = await supabase.from("crm_deals").delete().eq("id", deal.id)
    if (error) {
      toast.error("Failed to delete deal")
      setLoading(false)
      return
    }
    toast.success("Deal deleted")
    router.push("/admin/crm/deals")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Deal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact">Contact</Label>
              <Select
                value={contactId}
                onValueChange={(v) => setContactId(v ?? "")}
              >
                <SelectTrigger id="contact">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select
                value={assignedTo || "none"}
                onValueChange={(v) =>
                  setAssignedTo(v === "none" ? "" : (v ?? ""))
                }
              >
                <SelectTrigger id="assignedTo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="pipeline">Pipeline</Label>
              <Select
                value={pipelineId}
                onValueChange={(v) => {
                  setPipelineId(v ?? "")
                  setStage("")
                }}
              >
                <SelectTrigger id="pipeline">
                  <SelectValue placeholder="Select pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="stage">Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v ?? "")}>
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.name} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="value">Value (RWF)</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="expectedClose">Expected Close</Label>
              <Input
                id="expectedClose"
                type="date"
                value={expectedClose}
                onChange={(e) => setExpectedClose(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus((v as CrmDealStatus) ?? "open")}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : deal ? "Update Deal" : "Create Deal"}
        </Button>
        {deal && (
          <Button
            type="button"
            variant="outline"
            className="text-red-500 hover:text-red-500"
            disabled={loading}
            onClick={handleDelete}
          >
            Delete
          </Button>
        )}
      </div>
    </form>
  )
}
