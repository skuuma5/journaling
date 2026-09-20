import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { setLocalSession } from "@/lib/auth-local"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const username = body.username?.trim().toLowerCase()
    const password = body.password?.trim()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username }
    })

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 })
    }

    setLocalSession(user.id)

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("LOGIN_ERROR", error)
    return NextResponse.json({ error: "Failed to login" }, { status: 500 })
  }
}
