import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const strategies = await prisma.strategy.findMany({
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
  try {
    const body = await req.json()
    const { name, description } = body

    const strategy = await prisma.strategy.create({
      data: {
        name,
        description,
      }
    })

    return NextResponse.json(strategy)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 })
  }
}
