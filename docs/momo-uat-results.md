# MTN MoMo — UAT Sandbox Test Results

**Company:** Ajabu Lighting
**Sandbox:** https://sandbox.momodeveloper.mtn.com
**Product used:** Collection API (Request-to-Pay). The integration is a storefront
that **collects** payments from customers. It does **not** perform Disbursement or
Remittance, so those sections are Not Applicable.

> Note on status codes: the form's "Expected Result" column lists `202` for every
> row, but the MTN API returns the correct success code per endpoint —
> `201 Created` for provisioning, `200 OK` for token/status/queries, and
> `202 Accepted` for Request-to-Pay. All of these are successful responses; each
> row below shows the **actual** code observed.

## Collection API — TESTED ✅

| # | Scenario | API URL | Expected | Actual | Api Response (sample) | Result |
|---|----------|---------|----------|--------|-----------------------|--------|
| 1 | SandBox User Provisioning — Create API User | `POST /v1_0/apiuser` | 202 | **201** | (empty body; `X-Reference-Id` becomes the API user id) | **Pass** |
| 2 | SandBox User Provisioning — Create API Key | `POST /v1_0/apiuser/{X-Reference-Id}/apikey` | 202 | **201** | `{ "apiKey": "b2cc2c0a5d72…" }` | **Pass** |
| 3 | Collection — Token | `POST /collection/token/` | 202 | **200** | `{ "access_token": "eyJ…", "token_type": "access_token", "expires_in": 3600 }` | **Pass** |
| 4 | Collection — Debit Request / Request to Pay | `POST /collection/v1_0/requesttopay` | 202 | **202** | (empty body; `X-Reference-Id` is the transaction ref, e.g. `9dfb7955-7585-49e8-b16a-b2d55de33e40`) | **Pass** |
| 5 | Collection — Request to Pay Status | `GET /collection/v1_0/requesttopay/{referenceId}` | 202 | **200** | Success: `{ "amount":"100","currency":"EUR","status":"SUCCESSFUL","financialTransactionId":"1281957659","payer":{"partyIdType":"MSISDN","partyId":"56733123453"} }` | **Pass** |

### Request-to-Pay status scenarios verified (test MSISDNs)
| Payer MSISDN | Final status | Reason |
|---|---|---|
| 56733123453 | SUCCESSFUL | — |
| 46733123453 | SUCCESSFUL (after a short delay; PENDING while awaiting) | — |
| 46733123451 | FAILED | APPROVAL_REJECTED |
| 46733123450 | FAILED | INTERNAL_PROCESSING_ERROR |
| 46733123452 | FAILED | EXPIRED |

Also verified live on the deployed app (ajabulighting.com): a real checkout went
Request-to-Pay → PENDING → SUCCESSFUL → order confirmed.

## Collection API — NOT USED BY INTEGRATION

| # | Scenario | API URL | Actual (when probed) | Result |
|---|----------|---------|----------------------|--------|
| 6 | Account Status Check | `GET /collection/v1_0/accountholder/msisdn/{id}/active` | `500 NOT_ALLOWED_TARGET_ENVIRONMENT` | Not used by the storefront (collection is via Request-to-Pay). Endpoint not enabled/allowed for this sandbox subscription — raise with MTN if required. |
| 7 | Account Balance Check | `GET /collection/v1_0/account/balance` | `404 RESOURCE_NOT_FOUND` | Not used by the storefront. Not available for this sandbox subscription — raise with MTN if required. |

## Disbursement API (rows 8–13) — NOT APPLICABLE
The storefront does not disburse/pay out funds and is not subscribed to the
Disbursement product. Mark **Not Tested / N/A**.

## Remittance API (rows 14+) — NOT APPLICABLE
Not used and not subscribed. Mark **Not Tested / N/A**.
