import nodemailer from "nodemailer"
import { STORE_EMAIL } from "@/lib/utils/constants"

// SMTP transport (Gmail by default). For Gmail you must use an "App Password"
// (Google Account → Security → 2-Step Verification → App passwords), not your
// normal account password.
const host = process.env.SMTP_HOST || "smtp.gmail.com"
const port = Number(process.env.SMTP_PORT || 465)
const user = process.env.GMAIL_USER || process.env.SMTP_USER
const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD

// Send from the store's business address. Gmail keeps this From only when the
// SMTP account above has it verified under Settings → Accounts → "Send mail
// as"; otherwise Gmail rewrites From to the account's own address. Replies go
// to STORE_EMAIL either way.
export const EMAIL_FROM =
  process.env.EMAIL_FROM || `Ajabu Lighting <${STORE_EMAIL}>`
export const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO || STORE_EMAIL

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!user || !pass) {
    throw new Error(
      "SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD (or SMTP_USER/SMTP_PASSWORD) in your environment.",
    )
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465 (SSL), false for 587 (STARTTLS)
      auth: { user, pass },
    })
  }
  return transporter
}

type SendMailArgs = {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

/** Send an HTML email via SMTP. Drop-in replacement for the old Resend call. */
export async function sendMail({ to, subject, html, from, replyTo }: SendMailArgs) {
  return getTransporter().sendMail({
    from: from || EMAIL_FROM,
    replyTo: replyTo || EMAIL_REPLY_TO,
    to,
    subject,
    html,
  })
}
