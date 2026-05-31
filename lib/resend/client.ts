import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)

export const EMAIL_FROM = process.env.RESEND_FROM_EMAIL || "orders@lumiere.com"
export const EMAIL_REPLY_TO = process.env.RESEND_REPLY_TO || "support@lumiere.com"
