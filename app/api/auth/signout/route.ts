import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL("/", request.url), {
    // 303 forces the redirect to be followed with a GET
    status: 303,
  })
}
