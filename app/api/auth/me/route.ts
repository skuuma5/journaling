import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getLocalSession } from "@/lib/auth-local"
import { createClient } from "@/lib/supabase-server"

export async function GET() {
  const localUserId = getLocalSession()

  if (localUserId) {
    const user = await prisma.user.findUnique({
      where: { id: localUserId }
    })
    if (user) return NextResponse.json(user)
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const prismaUser = await prisma.user.findUnique({
      where: { id: user.id }
    })
    return NextResponse.json(prismaUser || user)
  }

  return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
}
