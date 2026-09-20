import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const username = body.username?.trim().toLowerCase()
    const password = body.password?.trim()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    })

    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 })
    }

    const user = await prisma.user.create({
      data: {
        username,
        password,
        name: username,
      }
    })

    // Removed setLocalSession to force manual login after registration
    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error("REGISTRATION_ERROR", error)
    return NextResponse.json({ error: "Failed to register" }, { status: 500 })
  }
}
