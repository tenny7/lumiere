/**
 * One-off: make the small WebP copies and blurred previews for product photos
 * uploaded before migration 00024. New uploads get them automatically
 * (app/api/admin/images/upload). Safe to re-run: only photos without copies
 * are processed, and originals are never changed.
 *
 * Uses the same code as the upload route (lib/images/variants.ts), which
 * needs Node 22 to run TypeScript directly:
 *
 *   nvm use 22
 *   node --experimental-strip-types scripts/optimize-product-images.mjs --dry-run
 *   node --experimental-strip-types scripts/optimize-product-images.mjs
 */

import { readFileSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"
import { createClient } from "@supabase/supabase-js"
import { optimizeImage, storagePath } from "../lib/images/variants.ts"

const __dirname = dirname(fileURLToPath(import.meta.url))
const dryRun = process.argv.includes("--dry-run")

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

const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`

const { data: images, error } = await db
  .from("product_images")
  .select("id, url")
  .is("variants", null)
if (error) {
  console.error("Could not read product_images (has migration 00024 run?):", error.message)
  process.exit(1)
}

console.log(`${images.length} photo(s) without copies${dryRun ? " (dry run, nothing is written)" : ""}`)

let before = 0
let after = 0
let failed = 0
for (const image of images) {
  const path = storagePath(image.url)
  const label = path ?? image.url
  if (!path || /\.gif$/i.test(path)) {
    console.log(`skip  ${label} (${path ? "GIF" : "not in the product-images bucket"})`)
    continue
  }
  try {
    const res = await fetch(image.url)
    if (!res.ok) throw new Error(`download failed: ${res.status}`)
    const original = Buffer.from(await res.arrayBuffer())
    if (dryRun) {
      console.log(`would ${label} (${kb(original.length)})`)
      continue
    }
    const optimized = await optimizeImage(db, path.replace(/\.[^./]+$/, ""), original)
    const { error: updateError } = await db
      .from("product_images")
      .update({
        width: optimized.width,
        height: optimized.height,
        blur_data_url: optimized.blurDataUrl,
        variants: optimized.variants,
      })
      .eq("id", image.id)
    if (updateError) throw updateError
    const card = optimized.variants[0]
    before += original.length
    after += card.bytes
    console.log(
      `done  ${label}: ${kb(original.length)} -> ${optimized.variants.map((v) => `${v.width}px ${kb(v.bytes)}`).join(", ")}`,
    )
  } catch (e) {
    failed++
    console.error(`FAIL  ${label}:`, e instanceof Error ? e.message : e)
  }
}

if (!dryRun && before > 0) {
  console.log(`Product cards now download ${kb(after)} in total instead of ${kb(before)}.`)
}
if (failed > 0) {
  console.error(`${failed} photo(s) failed; re-run to retry them.`)
  process.exit(1)
}
