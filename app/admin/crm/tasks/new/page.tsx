import { TaskForm } from "@/components/admin/task-form"

export default function NewTaskPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Task</h1>
        <p className="text-sm text-muted-foreground">
          Create a follow-up or action item
        </p>
      </div>
      <TaskForm />
    </div>
  )
}
