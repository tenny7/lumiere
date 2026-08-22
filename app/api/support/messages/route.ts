import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendMail, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/mail/client"
import { z } from "zod"

const sendSchema = z.object({
  orderId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
})

// Resolve the caller: are they an admin, and do they have access to this order?
async function resolveAccess(userId: string, orderId: string) {
  const adminDb = createAdminClient()
  const [{ data: profile }, { data: order }] = await Promise.all([
    adminDb.from("profiles").select("role").eq("id", userId).single(),
    adminDb
      .from("orders")
      .select("id, order_number, customer_id")
      .eq("id", orderId)
      .single(),
  ])
  const isAdmin = !!profile && ["admin", "super_admin"].includes(profile.role)
  const isOwner = !!order && order.customer_id === userId
  return { adminDb, order, isAdmin, isOwner }
}

// GET /api/support/messages?orderId=... — the thread for one order.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orderId = request.nextUrl.searchParams.get("orderId")
  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 })
  }

  const { order, isAdmin, isOwner } = await resolveAccess(user.id, orderId)
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const adminDb = createAdminClient()
  const { data: messages } = await adminDb
    .from("support_messages")
    .select("id, sender_role, body, read_at, created_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true })

  return NextResponse.json({ messages: messages || [] })
}

// POST /api/support/messages — send a message on an order's thread.
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const parsed = sendSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  const { orderId, body } = parsed.data

  const { adminDb, order, isAdmin, isOwner } = await resolveAccess(
    user.id,
    orderId,
  )
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }
  if (!isAdmin && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const senderRole = isAdmin ? "admin" : "customer"
  const { data: message, error } = await adminDb
    .from("support_messages")
    .insert({
      order_id: orderId,
      sender_id: user.id,
      sender_role: senderRole,
      body,
    })
    .select("id, sender_role, body, read_at, created_at")
    .single()

  if (error || !message) {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 })
  }

  // When the admin messages the customer, also notify by email.
  if (senderRole === "admin") {
    try {
      const { data: customer } = await adminDb
        .from("profiles")
        .select("email, full_name")
        .eq("id", order.customer_id)
        .single()
      if (customer?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || ""
        const link = `${appUrl}/account/orders/${orderId}`
        await sendMail({
          from: EMAIL_FROM,
          replyTo: EMAIL_REPLY_TO,
          to: customer.email,
          subject: `Message about your order ${order.order_number}`,
          html: supportEmailHtml({
            name: customer.full_name || "there",
            orderNumber: order.order_number,
            body,
            link,
          }),
        })
      }
    } catch (e) {
      console.error("Support email failed:", e)
    }
  }

  return NextResponse.json({ message })
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function supportEmailHtml({
  name,
  orderNumber,
  body,
  link,
}: {
  name: string
  orderNumber: string
  body: string
  link: string
}) {
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <h2 style="font-weight:500">Ajabu Lighting — Support</h2>
    <p>Hi ${escapeHtml(name)},</p>
    <p>You have a new message regarding your order
      <strong>${escapeHtml(orderNumber)}</strong>:</p>
    <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #f59e0b;background:#faf7f0;white-space:pre-wrap">${escapeHtml(
      body,
    )}</blockquote>
    <p><a href="${link}" style="color:#b45309">View and reply in your account &rarr;</a></p>
    <p style="color:#888;font-size:12px">If the link doesn't work, sign in and open the order from your Orders page.</p>
  </div>`
}
