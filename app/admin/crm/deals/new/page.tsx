import { DealForm } from "@/components/admin/deal-form"

export default function NewDealPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Deal</h1>
        <p className="text-sm text-muted-foreground">
          Add a deal to the sales pipeline
        </p>
      </div>
      <DealForm />
    </div>
  )
}
