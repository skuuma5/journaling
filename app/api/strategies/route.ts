import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const strategies = await prisma.strategy.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { trades: true }
        }
      }
    })
    return NextResponse.json(strategies)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description } = body

    const strategy = await prisma.strategy.create({
      data: {
        name,
        description,
        userId: user.id
      }
    })

    return NextResponse.json(strategy)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 })
  }
}
