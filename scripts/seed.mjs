/**
 * Seed the Supabase database by running the migration SQL,
 * then send a test email via Resend.
 *
 * Usage: node scripts/seed.mjs
 */

import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env.local
const envPath = resolve(__dirname, "../.env.local")
const envContent = readFileSync(envPath, "utf-8")
const env = {}
for (const line of envContent.split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const eqIdx = trimmed.indexOf("=")
  if (eqIdx === -1) continue
  env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1)
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_API_KEY = env.RESEND_API_KEY
const RESEND_FROM = env.RESEND_FROM_EMAIL || "orders@lumiere.com"

console.log("🔧 Supabase URL:", SUPABASE_URL)
console.log("🔧 Service role key:", SERVICE_ROLE_KEY?.slice(0, 20) + "...")
console.log()

// ============================================
// Step 1: Run migration SQL via Supabase SQL endpoint
// ============================================
async function runSQL(sql, label) {
  console.log(`⏳ Running: ${label}...`)
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!res.ok) {
    const text = await res.text()
    // Try the pg_net/SQL approach instead
    return { ok: false, error: text }
  }
  return { ok: true, data: await res.json() }
}

// The REST API doesn't support raw SQL. Use the management API instead.
async function seedDatabase() {
  const migrationPath = resolve(
    __dirname,
    "../supabase/migrations/00001_initial_schema.sql",
  )
  const sql = readFileSync(migrationPath, "utf-8")

  console.log("⏳ Seeding database via Supabase SQL API...")
  console.log(`   Migration file: ${sql.length} chars`)
  console.log()

  // Use the Supabase management SQL endpoint (available on hosted projects)
  // POST /pg/query - runs arbitrary SQL
  const res = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ query: sql }),
  })

  if (!res.ok) {
    console.log("⚠️  /pg/query endpoint not available, trying alternative...")

    // Alternative: use the Supabase SQL Editor API
    // This requires splitting the SQL into individual statements
    // and running them via rpc
    //
    // Instead, let's try the supabase CLI if available
    return false
  }

  const data = await res.json()
  console.log("✅ Database seeded successfully!")
  console.log(data)
  return true
}

// Alternative: use supabase CLI
async function seedWithCLI() {
  const { execSync } = await import("child_process")
  const migrationPath = resolve(
    __dirname,
    "../supabase/migrations/00001_initial_schema.sql",
  )

  try {
    // Try psql directly via the Supabase connection string
    // The connection string format is: postgresql://postgres:[SERVICE_ROLE_KEY]@[HOST]:5432/postgres
    const host = SUPABASE_URL.replace("https://", "").replace(".supabase.co", "")
    const connString = `postgresql://postgres.${host}:${SERVICE_ROLE_KEY}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

    console.log("⏳ Trying psql connection...")
    execSync(`psql "${connString}" -f "${migrationPath}" 2>&1`, {
      encoding: "utf-8",
      timeout: 30000,
    })
    console.log("✅ Database seeded via psql!")
    return true
  } catch (e) {
    console.log("⚠️  psql not available or connection failed")
    console.log("   Error:", e.message?.split("\n")[0])
    return false
  }
}

// Alternative: use fetch to run SQL statement by statement via PostgREST rpc
async function seedViaRPC() {
  // Create a helper function in the database first, then call it
  // Actually, let's just use the Supabase JS client
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const migrationPath = resolve(
    __dirname,
    "../supabase/migrations/00001_initial_schema.sql",
  )
  const sql = readFileSync(migrationPath, "utf-8")

  // Split into individual statements
  const statements = sql
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"))

  console.log(`⏳ Running ${statements.length} SQL statements...`)
  let success = 0
  let errors = 0

  for (const stmt of statements) {
    if (!stmt || stmt.startsWith("--")) continue

    const { error } = await supabase.rpc("exec_sql", { sql_text: stmt + ";" })
    if (error) {
      // Try direct SQL via the REST endpoint
      const { error: error2 } = await supabase.from("_exec").select().throwOnError()
      if (error2) {
        // Expected - just count
        if (
          error.message?.includes("already exists") ||
          error.message?.includes("duplicate")
        ) {
          success++
        } else {
          errors++
          if (errors <= 3) {
            console.log(`   ⚠️  ${error.message?.slice(0, 100)}`)
          }
        }
      }
    } else {
      success++
    }
  }

  console.log(`   ✅ ${success} succeeded, ❌ ${errors} failed`)
  return errors === 0
}

// ============================================
// Step 2: Send test email via Resend
// ============================================
async function sendTestEmail() {
  console.log()
  console.log("📧 Sending test email via Resend...")

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: "delivered@resend.dev", // Resend's test inbox
      subject: "Lumiere — Test Email",
      html: `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background-color:#0a0a08;color:#f5f0e8;padding:40px 20px">
          <div style="max-width:600px;margin:0 auto;background-color:#141410;border-radius:8px;overflow:hidden">
            <div style="padding:32px 40px;border-bottom:1px solid #2a2a24;text-align:center">
              <h1 style="font-size:28px;font-weight:300;letter-spacing:6px;color:#c9a96e;margin:0">LUMIERE</h1>
            </div>
            <div style="padding:40px">
              <h2 style="font-size:22px;font-weight:400;color:#f5f0e8;margin:0 0 8px 0">Test Email Successful! 🎉</h2>
              <p style="font-size:15px;line-height:24px;color:#a8a294;margin:0 0 24px 0">
                This confirms that Resend is correctly configured for the Lumiere ecommerce application.
              </p>
              <p style="font-size:14px;color:#7a7568;margin:0">
                Sent at: ${new Date().toISOString()}
              </p>
            </div>
            <div style="padding:24px 40px;border-top:1px solid #2a2a24;text-align:center">
              <p style="font-size:12px;color:#5a5548;margin:0">Lumiere Lighting &middot; Kigali, Rwanda</p>
            </div>
          </div>
        </div>
      `,
    }),
  })

  const data = await res.json()

  if (res.ok) {
    console.log("✅ Test email sent successfully!")
    console.log("   Email ID:", data.id)
  } else {
    console.log("❌ Email failed:", JSON.stringify(data))
  }

  return res.ok
}

// ============================================
// Main
// ============================================
async function main() {
  console.log("🚀 Lumiere Database Seeding & Email Test")
  console.log("========================================")
  console.log()

  // Try database seeding approaches in order
  let dbSeeded = await seedDatabase()
  if (!dbSeeded) {
    dbSeeded = await seedWithCLI()
  }
  if (!dbSeeded) {
    console.log()
    console.log("📋 Could not auto-seed. Please run the migration manually:")
    console.log("   1. Go to your Supabase Dashboard → SQL Editor")
    console.log("   2. Paste the contents of supabase/migrations/00001_initial_schema.sql")
    console.log("   3. Click 'Run'")
    console.log()
  }

  // Always try sending the test email
  await sendTestEmail()
}

main().catch(console.error)
