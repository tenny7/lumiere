"use client"

import { useState } from "react"
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
import { formatDateTime } from "@/lib/utils/format"
import type { CrmInteraction, CrmInteractionType } from "@/lib/types"

const TYPES: CrmInteractionType[] = [
  "note",
  "call",
  "email",
  "sms",
  "meeting",
  "complaint",
  "follow_up",
]

export function ContactInteractions({
  contactId,
  interactions,
}: {
  contactId: string
  interactions: CrmInteraction[]
}) {
  const router = useRouter()
  const supabase = createClient()
  const [type, setType] = useState<CrmInteractionType>("note")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim() && !subject.trim()) {
      toast.error("Add a subject or note")
      return
    }
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { error } = await supabase.from("crm_interactions").insert({
      contact_id: contactId,
      agent_id: user?.id || null,
      type,
      subject: subject.trim() || null,
      body: body.trim() || null,
    })

    if (error) {
      toast.error("Failed to log interaction")
      setLoading(false)
      return
    }
    setSubject("")
    setBody("")
    setType("note")
    toast.success("Interaction logged")
    router.refresh()
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={type}
                onValueChange={(v) =>
                  setType((v as CrmInteractionType) ?? "note")
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="body">Notes</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
            />
          </div>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Logging..." : "Log Interaction"}
          </Button>
        </form>

        <div className="space-y-4">
          {interactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            interactions.map((i) => (
              <div key={i.id} className="border-l-2 border-muted pl-4 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium capitalize">
                    {i.type.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {formatDateTime(i.created_at)}
                  </span>
                </div>
                {i.subject && (
                  <p className="text-sm font-medium mt-0.5">{i.subject}</p>
                )}
                {i.body && (
                  <p className="text-sm text-muted-foreground">{i.body}</p>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
