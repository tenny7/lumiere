import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { TaskForm } from "@/components/admin/task-form"

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: task } = await supabase
    .from("crm_tasks")
    .select("*")
    .eq("id", id)
    .single()

  if (!task) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Task</h1>
        <p className="text-sm text-muted-foreground">{task.title}</p>
      </div>
      <TaskForm task={task} />
    </div>
  )
}
