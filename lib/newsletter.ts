import "server-only"
import { sendMail } from "@/lib/mail/client"
import { renderNewsletterEmail } from "@/lib/emails/render"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://ajabulighting.com"

// The subscriber's row id (a random UUID) is the unsubscribe key.
export const unsubscribeUrl = (subscriberId: string) =>
  `${APP_URL}/newsletter/unsubscribe?id=${encodeURIComponent(subscriberId)}`

/** One newsletter-style email to one subscriber, with an unsubscribe link. */
export async function sendNewsletterEmail({
  to,
  subscriberId,
  subject,
  title,
  message,
}: {
  to: string
  subscriberId: string
  subject: string
  title: string
  message: string
}) {
  const url = unsubscribeUrl(subscriberId)
  return sendMail({
    to,
    subject,
    html: renderNewsletterEmail({ title, message, unsubscribeUrl: url, appUrl: APP_URL }),
    headers: { "List-Unsubscribe": `<${url}>` },
  })
}
