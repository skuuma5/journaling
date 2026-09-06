import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { startOfDay, endOfDay } from "date-fns"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')
  const date = dateStr ? new Date(dateStr) : new Date()

  try {
    const user = await prisma.user.findUnique({ where: { email: "trader@example.com" } })
    if (!user) return NextResponse.json({})

    const entry = await prisma.journalEntry.findFirst({
      where: {
        userId: user.id,
        date: {
          gte: startOfDay(date),
          lte: endOfDay(date),
        },
      },
    })
    return NextResponse.json(entry || {})
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch journal entry" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      date, marketBias, importantNews, plan, levels,
      scenarios, lessons, mistakes, tomorrowPlan, mood, rating
    } = body

    const entryDate = new Date(date)

    // Ensure user exists
    const user = await prisma.user.upsert({
      where: { email: "trader@example.com" },
      update: {},
      create: {
        email: "trader@example.com",
        name: "Professional Trader",
      },
    })

    const entry = await prisma.journalEntry.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: startOfDay(entryDate),
        },
      },
      update: {
        marketBias,
        importantNews,
        plan,
        levels,
        scenarios,
        lessons,
        mistakes,
        tomorrowPlan,
        mood,
        rating: parseInt(rating),
      },
      create: {
        userId: user.id,
        date: startOfDay(entryDate),
        marketBias,
        importantNews,
        plan,
        levels,
        scenarios,
        lessons,
        mistakes,
        tomorrowPlan,
        mood,
        rating: parseInt(rating),
      },
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error("JOURNAL_POST_ERROR", error)
    return NextResponse.json({ error: "Failed to save journal entry" }, { status: 500 })
  }
}
