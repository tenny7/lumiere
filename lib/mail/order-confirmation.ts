import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendMail, EMAIL_FROM, EMAIL_REPLY_TO } from "@/lib/mail/client"
import { renderOrderConfirmationEmail } from "@/lib/emails/render"

/**
 * Email the customer their "Order Confirmed" message, built from the charges
 * stored on the order. Best-effort: logs and returns on any failure, so it can
 * never break the action that triggered it.
 */
export async function sendOrderConfirmationEmail(orderId: string) {
  try {
    const db = createAdminClient()
    const { data: order } = await db
      .from("orders")
      .select(
        "order_number, subtotal, discount_amount, delivery_fee, tax_amount, total, shipping_address, customer:profiles(email, full_name), items:order_items(product_name, quantity, unit_price, total_price)",
      )
      .eq("id", orderId)
      .single()
    if (!order) return

    const customer = order.customer as unknown as {
      email: string | null
      full_name: string | null
    } | null
    if (!customer?.email) return

    const address = (order.shipping_address || {}) as {
      full_name?: string
      line_1?: string
      city?: string
      region?: string
    }
    const items = (
      (order.items || []) as {
        product_name: string
        quantity: number
        unit_price: number
        total_price: number
      }[]
    ).map((i) => ({
      name: i.product_name,
      quantity: i.quantity,
      unitPrice: Number(i.unit_price),
      total: Number(i.total_price),
    }))

    const html = renderOrderConfirmationEmail({
      customerName: address.full_name || customer.full_name || "Customer",
      orderNumber: order.order_number,
      items,
      subtotal: Number(order.subtotal),
      discount: Number(order.discount_amount) || 0,
      deliveryFee: Number(order.delivery_fee) || 0,
      tax: Number(order.tax_amount) || 0,
      total: Number(order.total),
      shippingAddress: {
        fullName: address.full_name || customer.full_name || "",
        line1: address.line_1 || "",
        city: address.city || "",
        region: address.region || "",
      },
    })

    await sendMail({
      from: EMAIL_FROM,
      replyTo: EMAIL_REPLY_TO,
      to: customer.email,
      subject: `Order Confirmed — ${order.order_number}`,
      html,
    })
  } catch (e) {
    console.error("Order confirmation email failed:", e)
  }
}
