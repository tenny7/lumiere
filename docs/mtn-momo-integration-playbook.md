# MTN MoMo Collection — Integration Playbook

A reusable, end-to-end guide for integrating **MTN Mobile Money Collections**
(customer pays the store) into this app and getting approved for production.
Captures the exact steps, the gotchas we hit, and the documents to submit.

> Scope: **Collections only** (Request-to-Pay). This store *collects* money from
> customers. It does not disburse (pay out) or remit.

---

## 0. Context — how MTN MoMo is organised

- **Two portals, two systems (do not mix them up):**
  - **https://momodeveloper.mtn.com** — the **GLOBAL sandbox** developer portal.
    Keys created here authenticate against `sandbox.momodeveloper.mtn.com`.
    **Use this for all testing.** ← MTN's email points here.
  - **https://momodeveloper.mtn.co.rw** — the **Rwanda production / go-live**
    onboarding portal (contracts, commercials, country access). A key from here
    will **not** work on the global sandbox (you'll get `401 invalid subscription key`).
- **Three API products** exist (Collection, Disbursement, Remittance). We only
  use **Collection**.
- **Two ways a payment gets confirmed:** *polling* the status endpoint (works
  everywhere) and an async *callback/webhook* (production, public URL). This app
  supports both.

---

## 1. MTN's requirements (from their onboarding email)

**Contract → Commercials**
- **Collections: 2.36% VAT inclusive** — MTN deducts 2.36% of every collected
  payment; that figure already includes VAT (nothing added on top). On RWF
  100,000 you net ~RWF 97,640.
- **120 RWF for Disbursement** — a flat fee *per payout*. **N/A** for a
  collections-only store (we don't disburse).

**Regulatory & Compliance** (business/legal documents you must obtain)
- **NCSA Data Protection license** — register at https://dpo.gov.rw/
- **Customer user journey + brief business description** — see
  `docs/momo-business-description-and-user-journey.md`
- **RDB certificate**

**Technical**
- Test on **https://momodeveloper.mtn.com** (docs included there).
- Fill the **UAT form** (`STANDARD OPEN API UAT TESTS(...).xlsx`) after closing
  sandbox tests, then submit all documents.

---

## 2. Step-by-step integration

> **Fast path (recommended):** once you have a Primary Key, run
> `MOMO_COLLECTION_PRIMARY_KEY=<key> node scripts/momo-setup.mjs`. It provisions
> the sandbox API user/key, creates or safely merges `.env.local` (keeping your
> other variables), and smoke-tests token → requesttopay → status — replacing
> Steps 2–5 below. The manual steps remain here for reference and for production.

### Step 1 — Get a sandbox subscription key
1. Sign up / log in at **https://momodeveloper.mtn.com** (the `.com`).
2. Subscribe to the **Collection** product.
3. Profile → Subscriptions → copy the **Primary Key** (`Ocp-Apim-Subscription-Key`).
   32 hex chars, no trailing spaces.

### Step 2 — Provision a sandbox API user + API key
The subscription key alone isn't enough; you self-provision an API user/key.
Use the helper: `scripts/test-momo-sandbox.mjs`.

```bash
MOMO_COLLECTION_PRIMARY_KEY=<primary key> node scripts/test-momo-sandbox.mjs --print-creds
```

It runs the full flow and prints `MOMO_COLLECTION_API_USER` / `MOMO_COLLECTION_API_KEY`
to paste into `.env.local`. (Endpoints below.)

### Step 3 — Configure `.env.local` (see template in §4)

### Step 4 — Understand the flow
Token → Request-to-Pay → poll Status (until SUCCESSFUL/FAILED). On SUCCESSFUL the
app confirms the order, decrements stock, clears the cart, emails the customer.

### Step 5 — Test in sandbox
Use the test MSISDNs in §5 to exercise success, failure, and pending.

### Step 6 — Fill the UAT Excel (see §6)

### Step 7 — Submit to MTN (see §7 email; attach docs)

### Step 8 — Go to production (see §8)

---

## 3. The endpoints (and the base-path gotcha)

| Purpose | Method & path | Base |
|---|---|---|
| Create API user | `POST /v1_0/apiuser` | **HOST ROOT** (`https://sandbox.momodeveloper.mtn.com`) |
| Create API key | `POST /v1_0/apiuser/{id}/apikey` | HOST ROOT |
| Verify API user | `GET /v1_0/apiuser/{id}` | HOST ROOT |
| Access token | `POST /collection/token/` | `.../collection` |
| Request to Pay | `POST /collection/v1_0/requesttopay` | `.../collection` |
| Status | `GET /collection/v1_0/requesttopay/{ref}` | `.../collection` |

⚠️ **Provisioning lives at the host root, NOT under `/collection`.** Only
token/requesttopay/status are under `/collection`.

Headers: `Authorization` (Basic for token, Bearer after), `X-Reference-Id` (a
UUID, per request), `X-Target-Environment` (`sandbox`/`production`),
`Ocp-Apim-Subscription-Key`, and (production only) `X-Callback-Url`.

---

## 4. `.env.local` template (annotated)

```bash
# ── MTN MoMo (Collection) ─────────────────────────────────────────
# "mock"   = no real calls (checkout auto-succeeds; for local dev without keys)
# "sandbox"= real calls to sandbox.momodeveloper.mtn.com (test)
# "production" = live
MOMO_ENVIRONMENT=sandbox

# Base URL must END AT /collection  (the client appends /token/ and /v1_0/...).
# NOT ".../collection/v1_0" — that doubles the version and 404s.
MOMO_COLLECTION_API_URL=https://sandbox.momodeveloper.mtn.com/collection

# From momodeveloper.mtn.com → Collection product → Primary Key (32 hex).
MOMO_COLLECTION_PRIMARY_KEY=<primary key>

# Provisioned by scripts/test-momo-sandbox.mjs --print-creds
MOMO_COLLECTION_API_USER=<uuid>
MOMO_COLLECTION_API_KEY=<api key>

# Currency: store/orders are RWF. In sandbox the app auto-substitutes EUR
# (sandbox only accepts EUR); production sends RWF.
MOMO_CURRENCY=RWF

# Callback: only SENT in production, and its host must match the API user's
# providerCallbackHost. On localhost/sandbox it's skipped (polling is used).
MOMO_CALLBACK_URL=https://yourdomain.com/api/webhooks/momo
MOMO_WEBHOOK_SECRET=<secret>   # verify MTN's actual callback signing before relying on it
```

> On **Vercel**, set these in Project → Settings → Environment Variables
> (`.env.local` is not deployed), then redeploy.

---

## 5. Sandbox test MSISDNs (verified)

| Payer MSISDN | Result |
|---|---|
| `56733123453` | SUCCESSFUL |
| `46733123453` | SUCCESSFUL (after a short delay; PENDING while awaiting) |
| `46733123451` | FAILED — APPROVAL_REJECTED |
| `46733123450` | FAILED — INTERNAL_PROCESSING_ERROR |
| `46733123452` | FAILED — EXPIRED |

The sandbox does **not** auto-approve every number (some stay PENDING) — that's
expected, not a bug. In production the customer approves on their phone.

---

## 6. The UAT Excel — what to fill

File: `STANDARD OPEN API UAT TESTS(...).xlsx`. Company name at top; then per row
fill **Api Response** (short) and **Actual Result** (Pass / Fail / Not Tested):

| Row | Scenario | Api Response | Result |
|---|---|---|---|
| 1–2 | Provisioning (apiuser, apikey) | `201 Created` | Pass |
| 3 | Token | `200 OK` | Pass |
| 4 | Request to Pay | `202 Accepted` | Pass |
| 5 | Request to Pay Status | `200 OK (SUCCESSFUL)` | Pass |
| 6 | Account Status Check | `N/A` | Not Tested |
| 7 | Account Balance Check | `N/A` | Not Tested |
| 8–13 | Disbursement (all) | `N/A` | Not Tested |
| 14+ | Remittance (all) | `N/A` | Not Tested |

Rows 6–7 aren't used by a collections-only checkout (they returned
`NOT_ALLOWED_TARGET_ENVIRONMENT` / `RESOURCE_NOT_FOUND` on our subscription).
Keep entries short — detail lives in `docs/momo-uat-results.md`.

---

## 7. The email to respond to MTN

Full draft: `docs/mtn-cover-email.md` (and `.docx`). It should:
- State the scope is **Collections only** (Disbursement/Remittance N/A).
- List attachments: **UAT form**, **business description + user journey**.
- List to-follow: **NCSA Data Protection license**, **RDB certificate**.
- Ask MTN to confirm: (a) Collections-only commercials (2.36%, no 120 RWF
  disbursement fee), (b) that UAT rows 6–7 aren't required.

---

## 8. Sandbox → Production checklist

- `MOMO_ENVIRONMENT=production`
- `MOMO_COLLECTION_API_URL` → the **production** collection base (confirm the
  exact host with MTN — it is *not* `sandbox.momodeveloper.mtn.com`).
- Production **subscription** key + an API user provisioned with
  `providerCallbackHost = yourdomain.com` (so the callback host matches).
- Currency becomes real **RWF** automatically (the EUR override is sandbox-only).
- Public HTTPS `MOMO_CALLBACK_URL` on your domain; **verify MTN's callback
  signature scheme** matches the webhook's `x-momo-signature` HMAC, or it will
  reject callbacks.
- Redeploy (Vercel env vars).

---

## 9. Gotchas we hit (symptom → cause → fix)

| Symptom | Cause | Fix |
|---|---|---|
| `401 invalid subscription key` | Key from the **.co.rw** (Rwanda) portal used on the global sandbox | Use a key from **momodeveloper.mtn.com** |
| `401 invalid subscription key` (clean key) | Trailing space / wrong key | Re-copy the Primary Key, no whitespace |
| `404 Resource not found` on provisioning | Provisioning called under `/collection` | Call `/v1_0/apiuser` at the **host root** |
| `500 Callback URL does not match` | `X-Callback-Url` host ≠ provisioned host (localhost in sandbox) | Only send callback in production with a matching host |
| Sandbox requesttopay rejected (currency) | Sent RWF | Sandbox needs **EUR** (app auto-substitutes in sandbox) |
| Status stuck PENDING | Sandbox doesn't auto-approve that number | Use a SUCCESS test MSISDN, or Mark Paid; production is real approval |
| Collected total looks too high vs bank | Gross, before MTN's 2.36% | Dashboard shows a **net (est.)** line = gross × 0.9764 |

---

## 10. Code touchpoints in this app

- `lib/momo/client.ts` — token, requestToPay (EUR-in-sandbox, callback-in-prod), status
- `app/api/payments/initiate/route.ts` — starts a MoMo payment
- `app/api/payments/[id]/status/route.ts` — polls + confirms on SUCCESSFUL
- `app/api/webhooks/momo/route.ts` — async callback (confirms on SUCCESSFUL)
- `app/api/payments/cod/route.ts` — Cash-on-Delivery (no gateway)
- `scripts/test-momo-sandbox.mjs` — the sandbox smoke test / provisioning helper
- Admin order page + `/admin/support` — shows MoMo response (reason, txn id) for support
