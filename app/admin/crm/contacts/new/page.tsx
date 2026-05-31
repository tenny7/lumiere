import { ContactForm } from "@/components/admin/contact-form"

export default function NewContactPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add Contact</h1>
        <p className="text-sm text-muted-foreground">
          Create a new CRM contact
        </p>
      </div>
      <ContactForm />
    </div>
  )
}
