"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { formatDate } from "@/lib/utils/format"
import { CRM_TASK_PRIORITY_LABELS } from "@/lib/utils/constants"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "lucide-react"

const priorityColors: Record<string, string> = {
  low: "bg-gray-500/10 text-gray-500",
  medium: "bg-blue-500/10 text-blue-500",
  high: "bg-orange-500/10 text-orange-500",
  urgent: "bg-red-500/10 text-red-500",
}

interface TaskItemData {
  id: string
  title: string
  description: string | null
  priority: string
  due_date: string | null
  contact: { full_name: string } | null
  assignee: { full_name: string } | null
}

export function TaskItem({ task }: { task: TaskItemData }) {
  const router = useRouter()
  const [done, setDone] = useState(false)

  async function complete() {
    setDone(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("crm_tasks")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", task.id)
    if (error) {
      setDone(false)
      toast.error("Failed to complete task")
      return
    }
    toast.success("Task completed")
    router.refresh()
  }

  return (
    <Card className={done ? "opacity-50" : ""}>
      <CardContent className="p-4 flex items-start gap-3">
        <Checkbox className="mt-0.5" checked={done} onCheckedChange={complete} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/admin/crm/tasks/${task.id}`}
              className="text-sm font-medium hover:underline"
            >
              {task.title}
            </Link>
            <Badge
              variant="secondary"
              className={`text-[0.55rem] ${priorityColors[task.priority]}`}
            >
              {CRM_TASK_PRIORITY_LABELS[task.priority]}
            </Badge>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
              {task.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            {task.contact && <span>{task.contact.full_name}</span>}
            {task.assignee && <span>Assigned to {task.assignee.full_name}</span>}
            {task.due_date && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
