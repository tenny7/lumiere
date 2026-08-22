/**
 * MTN MoMo Collection sandbox smoke test.
 *
 * Runs the full sandbox flow end-to-end so you can confirm the endpoints work
 * and capture request/response evidence for MTN's UAT form:
 *
 *   1. Provision an API user   (POST /v1_0/apiuser)
 *   2. Provision an API key    (POST /v1_0/apiuser/{id}/apikey)
 *   3. Verify the API user     (GET  /v1_0/apiuser/{id})
 *   4. Get an access token      (POST /token/)
 *   5. Request to pay           (POST /v1_0/requesttopay)
 *   6. Poll payment status      (GET  /v1_0/requesttopay/{ref})
 *
 * Prerequisites (from https://momodeveloper.mtn.com/):
 *   - Sign up, subscribe to the "Collection" product, copy the Primary Key.
 *   - Put it in .env.local as MOMO_COLLECTION_PRIMARY_KEY, OR pass it inline:
 *
 *       MOMO_COLLECTION_PRIMARY_KEY=<key> node scripts/test-momo-sandbox.mjs
 *
 * Notes:
 *   - The MTN sandbox only accepts currency EUR for requesttopay (RWF is
 *     production-only). Override with --currency=RWF once you're on production.
 *   - This script provisions fresh sandbox credentials on every run. To reuse
 *     credentials you already have, set MOMO_COLLECTION_API_USER and
 *     MOMO_COLLECTION_API_KEY (real, non-placeholder values) and it will skip
 *     steps 1-3.
 *
 * Usage:
 *   node scripts/test-momo-sandbox.mjs
 *   node scripts/test-momo-sandbox.mjs --msisdn=46733123453 --amount=100 --currency=EUR
 *   node scripts/test-momo-sandbox.mjs --print-creds   (echo provisioned creds for .env.local)
 */

import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { randomUUID } from "crypto"

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---------------------------------------------------------------------------
// Load .env.local (process.env takes precedence, so you can override inline)
// ---------------------------------------------------------------------------
const env = {}
try {
  const envContent = readFileSync(resolve(__dirname, "../.env.local"), "utf-8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eqIdx = trimmed.indexOf("=")
    if (eqIdx === -1) continue
    env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1)
  }
} catch {
  // .env.local is optional; everything can come from process.env / flags
}
const cfg = (key) => process.env[key] ?? env[key]

// ---------------------------------------------------------------------------
// CLI flags
// ---------------------------------------------------------------------------
const flags = {}
for (const arg of process.argv.slice(2)) {
  const m = arg.match(/^--([^=]+)(?:=(.*))?$/)
  if (m) flags[m[1]] = m[2] ?? true
}

// ---------------------------------------------------------------------------
// Resolve config
// ---------------------------------------------------------------------------
const PRIMARY_KEY = cfg("MOMO_COLLECTION_PRIMARY_KEY")
const TARGET_ENV = cfg("MOMO_ENVIRONMENT") === "production" ? "production" : "sandbox"
const CURRENCY = flags.currency || (TARGET_ENV === "sandbox" ? "EUR" : cfg("MOMO_CURRENCY") || "EUR")
const AMOUNT = String(flags.amount || "100")
// A common MTN sandbox test MSISDN. Override with --msisdn=...
const MSISDN = String(flags.msisdn || "46733123453")

// Normalise the base URL: the client appends "/token/" and "/v1_0/..." itself,
// so the base must end at ".../collection" (NOT ".../collection/v1_0").
const rawBase = cfg("MOMO_COLLECTION_API_URL") || "https://sandbox.momodeveloper.mtn.com/collection"
// COLLECTION_BASE ends at ".../collection" (token + requesttopay live here).
const COLLECTION_BASE = rawBase.replace(/\/+$/, "").replace(/\/v1_0$/, "")
// Sandbox user provisioning (apiuser/apikey) lives at the HOST ROOT, not under
// /collection — e.g. https://sandbox.momodeveloper.mtn.com/v1_0/apiuser
const HOST = new URL(COLLECTION_BASE).origin
const BASE = COLLECTION_BASE

// providerCallbackHost must be a bare host (no scheme/path).
let callbackHost = "example.com"
try {
  const u = new URL(cfg("MOMO_CALLBACK_URL") || "")
  if (u.hostname && u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
    callbackHost = u.hostname
  }
} catch {
  /* fall back to example.com */
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const steps = []
function log(title) {
  console.log(`\n\x1b[1m${title}\x1b[0m`)
}
function record(name, method, url, status, ok, detail) {
  steps.push({ name, method, url, status, ok })
  const mark = ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m"
  console.log(`  ${mark} ${method} ${url}  →  ${status}`)
  if (detail) console.log(`    ${detail}`)
}

async function fetchJson(name, method, url, { headers, body } = {}) {
  const res = await fetch(url, {
    method,
    headers,
    body,
    signal: AbortSignal.timeout(30000),
  })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { _raw: text }
  }
  return { res, json, text }
}

function fail(msg) {
  console.error(`\n\x1b[31mERROR:\x1b[0m ${msg}`)
  process.exit(1)
}

// ---------------------------------------------------------------------------
// Preflight
// ---------------------------------------------------------------------------
if (!PRIMARY_KEY || PRIMARY_KEY.startsWith("your-")) {
  fail(
    "MOMO_COLLECTION_PRIMARY_KEY is missing or still a placeholder.\n" +
      "  Get it from https://momodeveloper.mtn.com/ (sign up → subscribe to the\n" +
      "  Collection product → copy the Primary Key), then either set it in\n" +
      "  .env.local or run:\n\n" +
      "    MOMO_COLLECTION_PRIMARY_KEY=<key> node scripts/test-momo-sandbox.mjs",
  )
}

console.log("MTN MoMo Collection sandbox test")
console.log("--------------------------------")
console.log(`  Collection URL: ${COLLECTION_BASE}`)
console.log(`  Provision URL : ${HOST}`)
console.log(`  Target env    : ${TARGET_ENV}`)
console.log(`  Currency      : ${CURRENCY}`)
console.log(`  Amount        : ${AMOUNT}`)
console.log(`  Payer MSISDN  : ${MSISDN}`)
console.log(`  Callback host : ${callbackHost}`)

// ---------------------------------------------------------------------------
// Steps 1-3: provision (or reuse existing) API user + key
// ---------------------------------------------------------------------------
let apiUser = cfg("MOMO_COLLECTION_API_USER")
let apiKey = cfg("MOMO_COLLECTION_API_KEY")
const haveRealCreds =
  apiUser && apiKey && !apiUser.startsWith("your-") && !apiKey.startsWith("your-")

if (haveRealCreds) {
  log("Steps 1-3: Using existing API user/key from config (skipping provisioning)")
  console.log(`  API user: ${apiUser}`)
} else {
  log("Step 1: Provision API user  (POST /v1_0/apiuser)")
  apiUser = randomUUID()
  {
    const url = `${HOST}/v1_0/apiuser`
    const { res, text } = await fetchJson("create-apiuser", "POST", url, {
      headers: {
        "X-Reference-Id": apiUser,
        "Ocp-Apim-Subscription-Key": PRIMARY_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ providerCallbackHost: callbackHost }),
    })
    record("create-apiuser", "POST", url, res.status, res.status === 201, `X-Reference-Id: ${apiUser}`)
    if (res.status !== 201) fail(`Could not create API user: ${res.status} ${text}`)
  }

  log("Step 2: Provision API key  (POST /v1_0/apiuser/{id}/apikey)")
  {
    const url = `${HOST}/v1_0/apiuser/${apiUser}/apikey`
    const { res, json, text } = await fetchJson("create-apikey", "POST", url, {
      headers: { "Ocp-Apim-Subscription-Key": PRIMARY_KEY },
    })
    record("create-apikey", "POST", url, res.status, res.status === 201)
    if (res.status !== 201 || !json.apiKey) fail(`Could not create API key: ${res.status} ${text}`)
    apiKey = json.apiKey
  }

  log("Step 3: Verify API user  (GET /v1_0/apiuser/{id})")
  {
    const url = `${HOST}/v1_0/apiuser/${apiUser}`
    const { res, json } = await fetchJson("get-apiuser", "GET", url, {
      headers: { "Ocp-Apim-Subscription-Key": PRIMARY_KEY },
    })
    record(
      "get-apiuser",
      "GET",
      url,
      res.status,
      res.status === 200,
      `targetEnvironment: ${json.targetEnvironment}, callbackHost: ${json.providerCallbackHost}`,
    )
    if (res.status !== 200) fail(`Could not verify API user: ${res.status}`)
  }
}

if (flags["print-creds"]) {
  console.log("\n  Add these to .env.local to reuse this API user:")
  console.log(`  MOMO_COLLECTION_API_USER=${apiUser}`)
  console.log(`  MOMO_COLLECTION_API_KEY=${apiKey}`)
}

// ---------------------------------------------------------------------------
// Step 4: access token  (POST /token/)
// ---------------------------------------------------------------------------
log("Step 4: Get access token  (POST /token/)")
let token
{
  const url = `${BASE}/token/`
  const basic = Buffer.from(`${apiUser}:${apiKey}`).toString("base64")
  const { res, json, text } = await fetchJson("token", "POST", url, {
    headers: {
      Authorization: `Basic ${basic}`,
      "Ocp-Apim-Subscription-Key": PRIMARY_KEY,
    },
  })
  record("token", "POST", url, res.status, res.status === 200, res.status === 200 ? `expires_in: ${json.expires_in}s` : "")
  if (res.status !== 200 || !json.access_token) fail(`Token request failed: ${res.status} ${text}`)
  token = json.access_token
}

// ---------------------------------------------------------------------------
// Step 5: request to pay  (POST /v1_0/requesttopay)
// ---------------------------------------------------------------------------
log("Step 5: Request to pay  (POST /v1_0/requesttopay)")
const referenceId = randomUUID()
{
  const url = `${BASE}/v1_0/requesttopay`
  const body = {
    amount: AMOUNT,
    currency: CURRENCY,
    externalId: `TEST-${Date.now()}`,
    payer: { partyIdType: "MSISDN", partyId: MSISDN },
    payerMessage: "Sandbox test payment",
    payeeNote: "Sandbox test",
  }
  const { res, text } = await fetchJson("requesttopay", "POST", url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-Reference-Id": referenceId,
      "X-Target-Environment": TARGET_ENV,
      "Ocp-Apim-Subscription-Key": PRIMARY_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
  record("requesttopay", "POST", url, res.status, res.status === 202, `X-Reference-Id: ${referenceId}`)
  if (res.status !== 202) fail(`RequestToPay failed: ${res.status} ${text}`)
}

// ---------------------------------------------------------------------------
// Step 6: poll status  (GET /v1_0/requesttopay/{ref})
// ---------------------------------------------------------------------------
log("Step 6: Poll payment status  (GET /v1_0/requesttopay/{ref})")
let finalStatus = "PENDING"
{
  const url = `${BASE}/v1_0/requesttopay/${referenceId}`
  for (let attempt = 1; attempt <= 20; attempt++) {
    const { res, json, text } = await fetchJson("status", "GET", url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Target-Environment": TARGET_ENV,
        "Ocp-Apim-Subscription-Key": PRIMARY_KEY,
      },
    })
    if (res.status !== 200) {
      record("status", "GET", url, res.status, false, text)
      fail(`Status check failed: ${res.status} ${text}`)
    }
    finalStatus = json.status
    const resolved = finalStatus === "SUCCESSFUL" || finalStatus === "FAILED"
    console.log(
      `  attempt ${attempt}: status = ${finalStatus}` +
        (json.reason ? ` (${json.reason.code || ""} ${json.reason.message || json.reason})` : ""),
    )
    if (resolved) {
      record("status", "GET", url, res.status, finalStatus === "SUCCESSFUL", `final: ${finalStatus}`)
      break
    }
    await new Promise((r) => setTimeout(r, 2000))
  }
}

// ---------------------------------------------------------------------------
// Summary (paste-ready evidence for the UAT form)
// ---------------------------------------------------------------------------
log("Summary")
for (const s of steps) {
  console.log(`  ${s.ok ? "✓" : "✗"}  ${s.name.padEnd(14)} ${s.method.padEnd(4)} ${s.status}`)
}
console.log(`\n  Payment reference: ${referenceId}`)
console.log(`  Final status     : ${finalStatus}`)

const allOk = steps.every((s) => s.ok) && finalStatus === "SUCCESSFUL"
if (allOk) {
  console.log("\n\x1b[32mAll sandbox endpoints responded as expected.\x1b[0m")
  process.exit(0)
} else {
  console.log("\n\x1b[33mFlow completed but not fully SUCCESSFUL — review the steps above.\x1b[0m")
  process.exit(finalStatus === "FAILED" ? 0 : 1)
}
