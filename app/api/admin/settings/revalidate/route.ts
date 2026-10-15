import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { can } from "@/lib/permissions"

// POST /api/admin/settings/revalidate — called by Admin → Settings after a
// save, so the storefront (footer social links, Contact page) shows the new
// values on the next visit. Static pages otherwise keep the old values for
// up to an hour (see app/(storefront)/layout.tsx).
export async function POST() {
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
  if (!profile || !can(profile.role, "settings")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  revalidatePath("/", "layout")
  return NextResponse.json({ revalidated: true })
}
