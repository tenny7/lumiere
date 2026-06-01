/**
 * Render email templates to HTML strings without react-dom/server.
 * Next.js 16 disallows react-dom/server in API routes.
 */

interface OrderItem {
  name: string
  quantity: number
  unitPrice: number
  total: number
}

interface ShippingAddress {
  fullName: string
  line1: string
  city: string
  region: string
}

export function renderOrderConfirmationEmail(props: {
  customerName: string
  orderNumber: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  shippingAddress: ShippingAddress
}): string {
  const { customerName, orderNumber, items, subtotal, deliveryFee, total, shippingAddress } = props
  const orderDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const itemRows = items
    .map(
      (item) => `
    <tr>
      <td style="font-size:14px;color:#f5f0e8;padding:12px 0;border-bottom:1px solid #1e1e1a">${escapeHtml(item.name)}</td>
      <td style="font-size:14px;color:#a8a294;text-align:center;padding:12px 0;border-bottom:1px solid #1e1e1a">${item.quantity}</td>
      <td style="font-size:14px;color:#f5f0e8;text-align:right;padding:12px 0;border-bottom:1px solid #1e1e1a">RWF ${item.total.toFixed(2)}</td>
    </tr>`,
    )
    .join("")

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#0a0a08;color:#f5f0e8">
<div style="max-width:600px;margin:0 auto;padding:40px 20px">
<div style="background-color:#141410;border-radius:8px;overflow:hidden">
  <div style="padding:32px 40px;border-bottom:1px solid #2a2a24;text-align:center">
    <h1 style="font-size:28px;font-weight:300;letter-spacing:6px;color:#c9a96e;margin:0">LUMIERE</h1>
  </div>
  <div style="padding:40px">
    <h2 style="font-size:22px;font-weight:400;color:#f5f0e8;margin:0 0 8px 0">Thank you, ${escapeHtml(customerName)}!</h2>
    <p style="font-size:15px;line-height:24px;color:#a8a294;margin:0 0 32px 0">Your order has been confirmed and is being prepared.</p>
    <table style="width:100%;margin-bottom:24px">
      <tr>
        <td>
          <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#7a7568;margin:0 0 4px 0">Order Number</p>
          <p style="font-size:15px;font-weight:600;color:#f5f0e8;margin:0">${escapeHtml(orderNumber)}</p>
        </td>
        <td style="text-align:right">
          <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#7a7568;margin:0 0 4px 0">Order Date</p>
          <p style="font-size:15px;color:#f5f0e8;margin:0">${orderDate}</p>
        </td>
      </tr>
    </table>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <thead>
        <tr>
          <th style="text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7a7568;padding:8px 0;border-bottom:1px solid #2a2a24">Item</th>
          <th style="text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7a7568;padding:8px 0;border-bottom:1px solid #2a2a24">Qty</th>
          <th style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#7a7568;padding:8px 0;border-bottom:1px solid #2a2a24">Price</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <div style="margin-bottom:32px">
      <div style="display:flex;justify-content:space-between;padding:6px 0">
        <span style="font-size:14px;color:#a8a294">Subtotal</span>
        <span style="font-size:14px;color:#f5f0e8">RWF ${subtotal.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:6px 0">
        <span style="font-size:14px;color:#a8a294">Delivery</span>
        <span style="font-size:14px;color:#f5f0e8">RWF ${deliveryFee.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;padding:10px 0 0 0;border-top:1px solid #2a2a24;margin-top:6px">
        <span style="font-size:16px;font-weight:600;color:#f5f0e8">Total</span>
        <span style="font-size:16px;font-weight:600;color:#c9a96e">RWF ${total.toFixed(2)}</span>
      </div>
    </div>
    <div style="background-color:#1a1a16;border-radius:6px;padding:20px;margin-bottom:32px">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#7a7568;margin:0 0 8px 0">Shipping Address</p>
      <p style="font-size:14px;line-height:22px;color:#f5f0e8;margin:0">${escapeHtml(shippingAddress.fullName)}<br>${escapeHtml(shippingAddress.line1)}<br>${escapeHtml(shippingAddress.city)}, ${escapeHtml(shippingAddress.region)}</p>
    </div>
    <p style="font-size:14px;line-height:22px;color:#a8a294;margin:0">We will notify you when your order ships. If you have any questions, reply to this email.</p>
  </div>
  <div style="padding:24px 40px;border-top:1px solid #2a2a24;text-align:center">
    <p style="font-size:12px;color:#5a5548;margin:0;line-height:20px">Lumiere Lighting &middot; Kigali, Rwanda<br>&copy; ${new Date().getFullYear()} Lumiere. All rights reserved.</p>
  </div>
</div>
</div>
</body>
</html>`
}

export function renderShippingNotificationEmail(props: {
  customerName: string
  orderNumber: string
  trackingNumber?: string
  trackingCarrier?: string
  trackingUrl?: string
}): string {
  const { customerName, orderNumber, trackingNumber, trackingCarrier, trackingUrl } = props
  const trackingBlock = trackingNumber
    ? `<div style="background-color:#1a1a16;border-radius:6px;padding:20px;margin-bottom:24px">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#7a7568;margin:0 0 8px 0">Tracking</p>
      ${trackingCarrier ? `<p style="font-size:14px;color:#a8a294;margin:0 0 4px 0">Carrier: <span style="color:#f5f0e8">${escapeHtml(trackingCarrier)}</span></p>` : ""}
      <p style="font-size:15px;color:#f5f0e8;margin:0">Tracking #: <strong>${escapeHtml(trackingNumber)}</strong></p>
      ${trackingUrl ? `<p style="margin:12px 0 0 0"><a href="${escapeHtml(trackingUrl)}" style="color:#c9a96e;font-size:14px">Track your shipment &rarr;</a></p>` : ""}
    </div>`
    : ""
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#0a0a08;color:#f5f0e8">
<div style="max-width:600px;margin:0 auto;padding:40px 20px">
<div style="background-color:#141410;border-radius:8px;overflow:hidden">
  <div style="padding:32px 40px;border-bottom:1px solid #2a2a24;text-align:center">
    <h1 style="font-size:28px;font-weight:300;letter-spacing:6px;color:#c9a96e;margin:0">LUMIERE</h1>
  </div>
  <div style="padding:40px">
    <h2 style="font-size:22px;font-weight:400;color:#f5f0e8;margin:0 0 8px 0">Your order is on its way!</h2>
    <p style="font-size:15px;line-height:24px;color:#a8a294;margin:0 0 24px 0">Hi ${escapeHtml(customerName)}, great news — your order <strong style="color:#f5f0e8">${escapeHtml(orderNumber)}</strong> has been shipped.</p>
    ${trackingBlock}
    <div style="background-color:#1a1a16;border-radius:6px;padding:20px;margin-bottom:24px">
      <p style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#7a7568;margin:0 0 8px 0">Estimated Delivery</p>
      <p style="font-size:15px;color:#f5f0e8;margin:0">2–5 business days</p>
    </div>
    <p style="font-size:14px;line-height:22px;color:#a8a294;margin:0">We'll notify you when your order arrives. If you have any questions, reply to this email.</p>
  </div>
  <div style="padding:24px 40px;border-top:1px solid #2a2a24;text-align:center">
    <p style="font-size:12px;color:#5a5548;margin:0;line-height:20px">Lumiere Lighting &middot; Kigali, Rwanda<br>&copy; ${new Date().getFullYear()} Lumiere. All rights reserved.</p>
  </div>
</div>
</div>
</body>
</html>`
}

export function renderWelcomeEmail(props: {
  customerName: string
  appUrl: string
}): string {
  const { customerName, appUrl } = props
  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#0a0a08;color:#f5f0e8">
<div style="max-width:600px;margin:0 auto;padding:40px 20px">
<div style="background-color:#141410;border-radius:8px;overflow:hidden">
  <div style="padding:32px 40px;border-bottom:1px solid #2a2a24;text-align:center">
    <h1 style="font-size:28px;font-weight:300;letter-spacing:6px;color:#c9a96e;margin:0">LUMIERE</h1>
  </div>
  <div style="padding:40px">
    <h2 style="font-size:22px;font-weight:400;color:#f5f0e8;margin:0 0 8px 0">Welcome to Lumiere, ${escapeHtml(customerName)}!</h2>
    <p style="font-size:15px;line-height:24px;color:#a8a294;margin:0 0 24px 0">Thank you for creating an account. We curate exceptional lighting from artisan makers and renowned designers — explore our collection and find the perfect light for your space.</p>
    <div style="text-align:center;margin:32px 0">
      <a href="${escapeHtml(appUrl)}/products" style="display:inline-block;padding:14px 32px;background-color:#c9a96e;color:#0a0a08;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;text-decoration:none;border-radius:4px">Start Shopping</a>
    </div>
    <p style="font-size:14px;line-height:22px;color:#a8a294;margin:0">If you have any questions, reply to this email — we're here to help.</p>
  </div>
  <div style="padding:24px 40px;border-top:1px solid #2a2a24;text-align:center">
    <p style="font-size:12px;color:#5a5548;margin:0;line-height:20px">Lumiere Lighting &middot; Kigali, Rwanda<br>&copy; ${new Date().getFullYear()} Lumiere. All rights reserved.</p>
  </div>
</div>
</div>
</body>
</html>`
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
