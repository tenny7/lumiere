import { randomUUID } from "crypto"
import type {
  MomoRequestToPayBody,
  MomoRequestToPayResult,
  MomoTokenResponse,
} from "./types"

const API_URL = process.env.MOMO_COLLECTION_API_URL!
const PRIMARY_KEY = process.env.MOMO_COLLECTION_PRIMARY_KEY!
const API_USER = process.env.MOMO_COLLECTION_API_USER!
const API_KEY = process.env.MOMO_COLLECTION_API_KEY!
const ENVIRONMENT = process.env.MOMO_ENVIRONMENT || "sandbox"
const CALLBACK_URL = process.env.MOMO_CALLBACK_URL!

// Mock mode: lets checkout complete without real MTN MoMo credentials.
// Enable with MOMO_ENVIRONMENT=mock (or MOMO_MOCK=true). When on, requestToPay
// returns a fake reference and getPaymentStatus reports SUCCESSFUL, so the
// order is confirmed, stock is decremented, and the confirmation email is sent
// — exactly as a real successful payment would. Switch MOMO_ENVIRONMENT back to
// "sandbox" or "production" (with real creds) to use the live API.
const MOCK = ENVIRONMENT === "mock" || process.env.MOMO_MOCK === "true"

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const credentials = Buffer.from(`${API_USER}:${API_KEY}`).toString("base64")

  const res = await fetch(`${API_URL}/token/`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Ocp-Apim-Subscription-Key": PRIMARY_KEY,
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    throw new Error(`MoMo token error: ${res.status} ${await res.text()}`)
  }

  const data: MomoTokenResponse = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return data.access_token
}

export async function requestToPay(params: {
  amount: number
  currency: string
  phoneNumber: string
  externalId: string
  payerMessage?: string
  payeeNote?: string
}): Promise<{ referenceId: string }> {
  if (MOCK) {
    return { referenceId: `mock-${randomUUID()}` }
  }

  const token = await getAccessToken()
  const referenceId = randomUUID()

  const body: MomoRequestToPayBody = {
    amount: params.amount.toString(),
    currency: params.currency,
    externalId: params.externalId,
    payer: {
      partyIdType: "MSISDN",
      partyId: params.phoneNumber,
    },
    payerMessage: params.payerMessage || "Payment for Lumière order",
    payeeNote: params.payeeNote || `Order ${params.externalId}`,
  }

  const res = await fetch(`${API_URL}/v1_0/requesttopay`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": ENVIRONMENT,
      "Ocp-Apim-Subscription-Key": PRIMARY_KEY,
      "X-Callback-Url": CALLBACK_URL,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`MoMo RequestToPay failed: ${res.status} ${errorText}`)
  }

  return { referenceId }
}

export async function getPaymentStatus(
  referenceId: string,
): Promise<MomoRequestToPayResult> {
  if (MOCK) {
    // Report success. `amount` is intentionally empty so the caller's
    // amount-match check is skipped (it validates only when amount is present).
    return {
      amount: "",
      currency: process.env.MOMO_CURRENCY || "RWF",
      financialTransactionId: `mock-${Date.now()}`,
      externalId: referenceId,
      payer: { partyIdType: "MSISDN", partyId: "" },
      payerMessage: "Mock payment",
      payeeNote: "Mock payment",
      status: "SUCCESSFUL",
    }
  }

  const token = await getAccessToken()

  const res = await fetch(`${API_URL}/v1_0/requesttopay/${referenceId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Target-Environment": ENVIRONMENT,
      "Ocp-Apim-Subscription-Key": PRIMARY_KEY,
    },
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    throw new Error(`MoMo status check failed: ${res.status}`)
  }

  return res.json()
}
