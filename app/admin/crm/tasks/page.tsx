import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { TaskItem } from "@/components/admin/task-item"
import { Plus } from "lucide-react"

export default async function CrmTasksPage() {
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from("crm_tasks")
    .select("*, contact:crm_contacts(full_name), assignee:profiles!crm_tasks_assigned_to_fkey(full_name)")
    .in("status", ["todo", "in_progress"])
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">CRM Tasks</h1>
          <p className="text-sm text-muted-foreground">
            Follow-ups, calls, and action items
          </p>
        </div>
        <Button size="sm" render={<Link href="/admin/crm/tasks/new" />}>
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      <div className="space-y-2">
        {tasks?.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}

        {(!tasks || tasks.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-2">No tasks yet</p>
            <p className="text-sm">
              Create tasks to track follow-ups with contacts and deals
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
