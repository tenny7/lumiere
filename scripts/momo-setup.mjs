/**
 * MTN MoMo Collection — one-command setup / bootstrap.
 *
 * Portable: copy this single file into any Node project. It:
 *   1. provisions a sandbox API user + API key from your Primary Key,
 *   2. creates .env.local (or merges the MOMO_* vars into an existing one —
 *      never clobbering your other variables),
 *   3. smoke-tests token → requesttopay → status.
 *
 * Prereq: a Collection Primary Key from https://momodeveloper.mtn.com  (the
 * GLOBAL sandbox portal — NOT a country portal like momodeveloper.mtn.co.rw,
 * whose keys are rejected by the sandbox host).
 *
 * Usage:
 *   MOMO_COLLECTION_PRIMARY_KEY=<key> node scripts/momo-setup.mjs
 *   node scripts/momo-setup.mjs --key=<key> --callback=https://yourdomain.com/api/webhooks/momo
 *   node scripts/momo-setup.mjs --reprovision      # force new API user/key
 *   node scripts/momo-setup.mjs --no-test          # skip the smoke test
 *   node scripts/momo-setup.mjs --env=production --host=https://proxy.momoapi.mtn.com --key=<prodkey>
 *
 * Flags: --key --env(sandbox|production) --host --callback --currency --file --reprovision --no-test
 */

import {
  readFileSync,
  writeFileSync,
  existsSync,
} from "fs"
import { resolve } from "path"
import { randomUUID } from "crypto"

// ── args ────────────────────────────────────────────────────────────────────
const flags = {}
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--([^=]+)(?:=(.*))?$/)
  if (m) flags[m[1]] = m[2] ?? true
}
const log = (s = "") => console.log(s)
const die = (m) => {
  console.error(`\n\x1b[31mERROR:\x1b[0m ${m}`)
  process.exit(1)
}

// ── locate + parse existing .env.local ──────────────────────────────────────
const ENV_PATH = resolve(process.cwd(), flags.file || ".env.local")
function parseEnv(text) {
  const out = {}
  for (const line of text.split("\n")) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const i = t.indexOf("=")
    if (i > -1) out[t.slice(0, i)] = t.slice(i + 1)
  }
  return out
}
const existingText = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : ""
const existing = parseEnv(existingText)
const cfg = (k) => process.env[k] ?? existing[k]

// ── resolve config ──────────────────────────────────────────────────────────
const ENVIRONMENT =
  flags.env || (cfg("MOMO_ENVIRONMENT") === "production" ? "production" : "sandbox")
const isProd = ENVIRONMENT === "production"
const HOST = (
  flags.host ||
  (isProd
    ? cfg("MOMO_HOST") || "https://proxy.momoapi.mtn.com"
    : "https://sandbox.momodeveloper.mtn.com")
).replace(/\/+$/, "")
const COLLECTION_BASE = `${HOST}/collection`
const CURRENCY = flags.currency || cfg("MOMO_CURRENCY") || "RWF"
const CALLBACK =
  flags.callback || cfg("MOMO_CALLBACK_URL") || "https://example.com/api/webhooks/momo"

let PRIMARY = flags.key || cfg("MOMO_COLLECTION_PRIMARY_KEY")
if (!PRIMARY || /^your-|^<|placeholder/i.test(PRIMARY)) {
  die(
    "No valid MOMO_COLLECTION_PRIMARY_KEY.\n" +
      "  Get it from https://momodeveloper.mtn.com (subscribe to Collection →\n" +
      "  Primary Key), then: node scripts/momo-setup.mjs --key=<key>",
  )
}

function callbackHost() {
  try {
    const h = new URL(CALLBACK).hostname
    return h && h !== "localhost" && h !== "127.0.0.1" ? h : "example.com"
  } catch {
    return "example.com"
  }
}

async function api(method, url, { headers, body } = {}) {
  const res = await fetch(url, { method, headers, body, signal: AbortSignal.timeout(30000) })
  const text = await res.text()
  let json
  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { _raw: text }
  }
  return { res, json, text }
}

log("MTN MoMo setup")
log("──────────────")
log(`  Env file    : ${ENV_PATH}${existingText ? " (exists — will merge)" : " (will create)"}`)
log(`  Environment : ${ENVIRONMENT}`)
log(`  Host        : ${HOST}`)
log(`  Currency    : ${CURRENCY}`)

// ── provision API user + key (sandbox) ──────────────────────────────────────
let apiUser = cfg("MOMO_COLLECTION_API_USER")
let apiKey = cfg("MOMO_COLLECTION_API_KEY")
const haveCreds =
  apiUser && apiKey && !/^your-|^<|placeholder/i.test(apiUser) && !/^your-|^</i.test(apiKey)

if (haveCreds && !flags.reprovision) {
  log(`\n✓ Reusing existing API user (${apiUser}). Use --reprovision to replace.`)
} else {
  log("\nProvisioning API user + key…")
  apiUser = randomUUID()
  {
    const url = `${HOST}/v1_0/apiuser` // NB: host root, not /collection
    const { res, text } = await api("POST", url, {
      headers: {
        "X-Reference-Id": apiUser,
        "Ocp-Apim-Subscription-Key": PRIMARY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ providerCallbackHost: callbackHost() }),
    })
    if (res.status !== 201)
      die(
        `apiuser failed: ${res.status} ${text}\n  (401 usually means the key is from the wrong portal — use momodeveloper.mtn.com)`,
      )
  }
  {
    const url = `${HOST}/v1_0/apiuser/${apiUser}/apikey`
    const { res, json, text } = await api("POST", url, {
      headers: { "Ocp-Apim-Subscription-Key": PRIMARY },
    })
    if (res.status !== 201 || !json.apiKey) die(`apikey failed: ${res.status} ${text}`)
    apiKey = json.apiKey
  }
  log(`✓ Provisioned API user ${apiUser}`)
}

// ── write / merge .env.local ────────────────────────────────────────────────
const updates = {
  MOMO_ENVIRONMENT: ENVIRONMENT,
  MOMO_COLLECTION_API_URL: COLLECTION_BASE,
  MOMO_COLLECTION_PRIMARY_KEY: PRIMARY,
  MOMO_COLLECTION_API_USER: apiUser,
  MOMO_COLLECTION_API_KEY: apiKey,
  MOMO_CURRENCY: CURRENCY,
  MOMO_CALLBACK_URL: CALLBACK,
  MOMO_WEBHOOK_SECRET: cfg("MOMO_WEBHOOK_SECRET") || "change-me",
}

let lines = existingText ? existingText.split("\n") : []
const seen = new Set()
lines = lines.map((line) => {
  const m = line.match(/^([A-Z0-9_]+)=/)
  if (m && updates[m[1]] !== undefined) {
    seen.add(m[1])
    return `${m[1]}=${updates[m[1]]}`
  }
  return line
})
const toAppend = Object.keys(updates).filter((k) => !seen.has(k))
if (toAppend.length) {
  if (lines.length && lines[lines.length - 1].trim() !== "") lines.push("")
  lines.push("# MTN MoMo (Collection) — added by scripts/momo-setup.mjs")
  for (const k of toAppend) lines.push(`${k}=${updates[k]}`)
}
writeFileSync(ENV_PATH, lines.join("\n").replace(/\n*$/, "\n"))
log(
  `\n✓ Wrote ${ENV_PATH}\n  updated: ${[...seen].filter((k) => updates[k] !== undefined).join(", ") || "(none)"}\n  added:   ${toAppend.join(", ") || "(none)"}`,
)

// ── smoke test ──────────────────────────────────────────────────────────────
if (flags["no-test"]) {
  log("\n(Skipped smoke test — --no-test)")
} else {
  log("\nSmoke test…")
  const basic = Buffer.from(`${apiUser}:${apiKey}`).toString("base64")
  const { res: tr, json: tj, text: tt } = await api("POST", `${COLLECTION_BASE}/token/`, {
    headers: { Authorization: `Basic ${basic}`, "Ocp-Apim-Subscription-Key": PRIMARY },
  })
  if (tr.status !== 200 || !tj.access_token) die(`token failed: ${tr.status} ${tt}`)
  log("  ✓ token")
  const ref = randomUUID()
  const { res: pr, text: pt } = await api("POST", `${COLLECTION_BASE}/v1_0/requesttopay`, {
    headers: {
      Authorization: `Bearer ${tj.access_token}`,
      "X-Reference-Id": ref,
      "X-Target-Environment": ENVIRONMENT,
      "Ocp-Apim-Subscription-Key": PRIMARY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: "100",
      currency: isProd ? CURRENCY : "EUR", // sandbox only accepts EUR
      externalId: `SETUP-${ref.slice(0, 8)}`,
      payer: { partyIdType: "MSISDN", partyId: "56733123453" },
      payerMessage: "setup test",
      payeeNote: "setup test",
    }),
  })
  if (pr.status !== 202) die(`requesttopay failed: ${pr.status} ${pt}`)
  log("  ✓ requesttopay (202)")
  const { res: sr, json: sj } = await api("GET", `${COLLECTION_BASE}/v1_0/requesttopay/${ref}`, {
    headers: {
      Authorization: `Bearer ${tj.access_token}`,
      "X-Target-Environment": ENVIRONMENT,
      "Ocp-Apim-Subscription-Key": PRIMARY,
    },
  })
  if (sr.status !== 200) die(`status failed: ${sr.status}`)
  log(`  ✓ status (${sj.status})`)
}

log("\n\x1b[32mDone.\x1b[0m Next: copy lib/momo/, the payment API routes, the webhook,")
log("and the support_messages migration per docs/mtn-momo-integration-playbook.md.")
