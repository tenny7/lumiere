import { createAdminClient } from "@/lib/supabase/admin"
import { sendMail, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/mail/client"

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function shell(inner: string) {
  return `
  <div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <p style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#b45309">Ajabu Lighting · Admin</p>
    ${inner}
    <p style="color:#888;font-size:12px;margin-top:24px">You're receiving this because you're an admin on Ajabu Lighting.</p>
  </div>`
}

/** Email every admin / super_admin. Best-effort — never throws. */
async function notifyAdmins(subject: string, html: string) {
  try {
    const db = createAdminClient()
    const { data } = await db
      .from("profiles")
      .select("email")
      .in("role", ["admin", "super_admin"])
    const emails = (data || [])
      .map((p) => p.email)
      .filter((e): e is string => !!e)
    if (emails.length === 0) return
    await sendMail({
      from: EMAIL_FROM,
      replyTo: EMAIL_REPLY_TO,
      to: emails,
      subject,
      html: shell(html),
    })
  } catch (e) {
    console.error("Admin notify failed:", e)
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ""

export async function notifyAdminsNewOrder(o: {
  id: string
  order_number: string
  total: number
  currency: string
  customerName?: string | null
}) {
  await notifyAdmins(
    `New order ${o.order_number}`,
    `
    <h2 style="font-weight:600">New order placed</h2>
    <p><strong>${esc(o.order_number)}</strong></p>
    <p>Total: <strong>${esc(o.currency)} ${esc(Number(o.total).toLocaleString())}</strong></p>
    <p>Customer: ${esc(o.customerName || "—")}</p>
    <p style="margin-top:16px"><a href="${APP_URL}/admin/orders/${o.id}" style="color:#b45309">View order in admin &rarr;</a></p>
  `,
  )
}

export async function notifyAdminsNewMessage(m: {
  orderId: string
  orderNumber: string
  customerName?: string | null
  body: string
}) {
  await notifyAdmins(
    `New support message — ${m.orderNumber}`,
    `
    <h2 style="font-weight:600">New support message</h2>
    <p>Order <strong>${esc(m.orderNumber)}</strong> · ${esc(m.customerName || "customer")}</p>
    <blockquote style="margin:16px 0;padding:12px 16px;border-left:3px solid #f59e0b;background:#faf7f0;white-space:pre-wrap">${esc(
      m.body,
    )}</blockquote>
    <p><a href="${APP_URL}/admin/support/${m.orderId}" style="color:#b45309">Open the conversation &rarr;</a></p>
  `,
  )
}
