import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/resend/client"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(200),
  message: z.string().min(5).max(5000),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Please fill in all fields with valid values." },
        { status: 400 },
      )
    }

    const { name, email, message } = parsed.data
    const adminDb = createAdminClient()

    // Persist the message for the team to action.
    const { error: insertError } = await adminDb
      .from("contact_messages")
      .insert({ name, email, message })

    if (insertError) {
      console.error("Contact insert error:", insertError)
      return NextResponse.json(
        { error: "Failed to send your message. Please try again." },
        { status: 500 },
      )
    }

    // Capture as a CRM lead + interaction (best-effort).
    try {
      const { data: found } = await adminDb
        .from("crm_contacts")
        .select("id")
        .eq("email", email)
        .limit(1)
        .maybeSingle()

      let contactId = found?.id
      if (!contactId) {
        const { data: created } = await adminDb
          .from("crm_contacts")
          .insert({ full_name: name, email, source: "website", status: "lead" })
          .select("id")
          .single()
        contactId = created?.id
      }

      if (contactId) {
        await adminDb.from("crm_interactions").insert({
          contact_id: contactId,
          type: "note",
          subject: "Website contact form",
          body: message,
        })
      }
    } catch (crmError) {
      console.error("Contact CRM capture failed:", crmError)
    }

    // Notify the store inbox (best-effort).
    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        replyTo: email,
        to: EMAIL_REPLY_TO,
        subject: `New contact message from ${name}`,
        html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message.replace(/\n/g, "<br/>")}</p>`,
      })
    } catch (emailError) {
      console.error("Contact email failed:", emailError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact route error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    )
  }
}
