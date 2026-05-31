"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { CrmTask, CrmTaskPriority, CrmTaskStatus } from "@/lib/types"

const PRIORITIES: CrmTaskPriority[] = ["low", "medium", "high", "urgent"]
const STATUSES: CrmTaskStatus[] = ["todo", "in_progress", "done", "cancelled"]

export function TaskForm({ task }: { task?: CrmTask }) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [contacts, setContacts] = useState<{ id: string; full_name: string }[]>(
    [],
  )
  const [agents, setAgents] = useState<{ id: string; full_name: string }[]>([])

  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [priority, setPriority] = useState<CrmTaskPriority>(
    task?.priority || "medium",
  )
  const [status, setStatus] = useState<CrmTaskStatus>(task?.status || "todo")
  const [dueDate, setDueDate] = useState(
    task?.due_date ? new Date(task.due_date).toISOString().slice(0, 10) : "",
  )
  const [contactId, setContactId] = useState(task?.contact_id || "")
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to || "")

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: a }] = await Promise.all([
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
      setContacts(c || [])
      setAgents(a || [])
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const payload = {
      title,
      description: description || null,
      priority,
      status,
      due_date: dueDate ? new Date(dueDate).toISOString() : null,
      contact_id: contactId || null,
      assigned_to: assignedTo || null,
      completed_at: status === "done" ? new Date().toISOString() : null,
    }

    if (task) {
      const { error } = await supabase
        .from("crm_tasks")
        .update(payload)
        .eq("id", task.id)
      if (error) {
        toast.error("Failed to update task")
        setLoading(false)
        return
      }
      toast.success("Task updated")
    } else {
      const { error } = await supabase.from("crm_tasks").insert(payload)
      if (error) {
        toast.error(error.message)
        setLoading(false)
        return
      }
      toast.success("Task created")
    }

    router.push("/admin/crm/tasks")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Task Details</CardTitle>
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
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) =>
                  setPriority((v as CrmTaskPriority) ?? "medium")
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus((v as CrmTaskStatus) ?? "todo")}
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
            <div>
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact">Contact</Label>
              <Select
                value={contactId || "none"}
                onValueChange={(v) => setContactId(v === "none" ? "" : (v ?? ""))}
              >
                <SelectTrigger id="contact">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
      </Button>
    </form>
  )
}
