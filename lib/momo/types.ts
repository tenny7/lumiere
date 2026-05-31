export interface MomoRequestToPayBody {
  amount: string
  currency: string
  externalId: string
  payer: {
    partyIdType: "MSISDN"
    partyId: string
  }
  payerMessage: string
  payeeNote: string
}

export interface MomoRequestToPayResult {
  amount: string
  currency: string
  financialTransactionId: string
  externalId: string
  payer: {
    partyIdType: "MSISDN"
    partyId: string
  }
  payerMessage: string
  payeeNote: string
  status: "PENDING" | "SUCCESSFUL" | "FAILED"
  reason?: {
    code: string
    message: string
  }
}

export interface MomoTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}
