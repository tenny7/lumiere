import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { can } from "@/lib/permissions"
import { contentSettingKey, getSection } from "@/lib/content/sections"
import { normalizeContent } from "@/lib/content/normalize"

// PUT /api/admin/content/<section> — save one section of website text
// (Admin → Content). The body is cleaned against the section's fields
// (lib/content/normalize.ts), saved with the admin's own session so RLS
// ("Admin can manage settings") applies, then the storefront is refreshed.
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params
  const section = getSection(key)
  if (!section) {
    return NextResponse.json({ error: "Unknown content section" }, { status: 404 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!profile || !can(profile.role, "content")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }
  const data = normalizeContent(
    section.key,
    (body as { data?: unknown } | null)?.data,
  )

  const { data: saved, error } = await supabase
    .from("store_settings")
    .upsert(
      {
        key: contentSettingKey(section.key),
        value: data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    )
    .select("updated_at")
    .single()
  if (error) {
    console.error("Content save failed:", error.message)
    return NextResponse.json({ error: "Couldn't save. Please try again." }, { status: 500 })
  }

  // Every storefront page can show content (footer, home page, info pages).
  revalidatePath("/", "layout")
  return NextResponse.json({ data, updatedAt: saved?.updated_at ?? null })
}
