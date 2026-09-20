import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"

export async function POST() {
  // Clear local session
  cookies().delete('local-session')

  // Clear Supabase session
  const supabase = createClient()
  await supabase.auth.signOut()

  return NextResponse.json({ success: true })
}
