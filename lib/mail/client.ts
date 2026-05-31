import nodemailer from "nodemailer"

// SMTP transport (Gmail by default). For Gmail you must use an "App Password"
// (Google Account → Security → 2-Step Verification → App passwords), not your
// normal account password.
const host = process.env.SMTP_HOST || "smtp.gmail.com"
const port = Number(process.env.SMTP_PORT || 465)
const user = process.env.GMAIL_USER || process.env.SMTP_USER
const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD

// Gmail rewrites/rejects arbitrary "From" addresses, so the From must be the
// authenticated account (or a verified alias). Default it to the SMTP user.
export const EMAIL_FROM =
  process.env.EMAIL_FROM || (user ? `Lumière <${user}>` : "Lumière <no-reply@lumiere.com>")
export const EMAIL_REPLY_TO =
  process.env.EMAIL_REPLY_TO || user || "support@lumiere.com"

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
