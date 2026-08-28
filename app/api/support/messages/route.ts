import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendMail, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/mail/client"
import { notifyAdminsNewMessage } from "@/lib/mail/admin-notify"
import { z } from "zod"

const sendSchema = z.object({
  orderId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
})

// Resolve the caller: are they an admin, and do they have access to this order?
async function resolveAccess(userId: string, orderId: string) {
  const adminDb = createAdminClient()
  const [{ data: profile }, { data: order }] = await Promise.all([
    adminDb.from("profiles").select("role, support_blocked").eq("id", userId).single(),
    adminDb
      .from("orders")
      .select("id, order_number, customer_id")
      .eq("id", orderId)
      .single(),
  ])
  const isAdmin = !!profile && ["admin", "super_admin"].includes(profile.role)
  const isOwner = !!order && order.customer_id === userId
  const blocked = !!profile?.support_blocked
  return { adminDb, order, isAdmin, isOwner, blocked }
}

// Anti-spam: a customer may send at most this many messages per rolling window.
const RATE_LIMIT_MAX = 12
const RATE_LIMIT_WINDOW_MS = 60_000

const PAGE_SIZE = 30

// GET /api/support/messages?orderId=...[&before=ISO][&after=ISO]
//   - no cursor: the latest PAGE_SIZE messages (ascending) + hasMore (older exist)
//   - before=ISO: the page of older messages before that time (for "load earlier")
//   - after=ISO:  messages newer than that time (for polling), ascending
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const orderId = params.get("orderId")
  const before = params.get("before")
  const after = params.get("after")
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
  const cols = "id, sender_role, body, read_at, created_at"

  if (after) {
    // New messages since a timestamp — for polling. Ascending, no cap needed.
    const { data } = await adminDb
      .from("support_messages")
      .select(cols)
      .eq("order_id", orderId)
      .gt("created_at", after)
      .order("created_at", { ascending: true })
    return NextResponse.json({ messages: data || [], hasMore: false })
  }

  // Latest page (optionally before a cursor). Fetch newest-first, then reverse.
  let q = adminDb
    .from("support_messages")
    .select(cols)
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE + 1)
  if (before) q = q.lt("created_at", before)
  const { data } = await q
  const rows = data || []
  const hasMore = rows.length > PAGE_SIZE
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows
  page.reverse() // ascending for display
  return NextResponse.json({ messages: page, hasMore })
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

  const { adminDb, order, isAdmin, isOwner, blocked } = await resolveAccess(
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

  // Abuse controls apply to customers only — never to staff.
  if (senderRole === "customer") {
    if (blocked) {
      return NextResponse.json(
        {
          error:
            "Your messaging has been suspended by support. Please reach us by phone or email.",
        },
        { status: 403 },
      )
    }
    // Rate limit: cap messages per rolling window to stop spam floods.
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
    const { count } = await adminDb
      .from("support_messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", user.id)
      .gte("created_at", since)
    if ((count ?? 0) >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        {
          error:
            "You're sending messages too quickly. Please wait a moment and try again.",
        },
        { status: 429 },
      )
    }
  }
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

  // When a customer messages, email the admins.
  if (senderRole === "customer") {
    const { data: sender } = await adminDb
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single()
    await notifyAdminsNewMessage({
      orderId,
      orderNumber: order.order_number,
      customerName: sender?.full_name,
      body,
    })
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
