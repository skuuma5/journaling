import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createClient } from '@/lib/supabase-server'
import { startOfDay, endOfDay } from "date-fns"

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')
  const date = dateStr ? new Date(dateStr) : new Date()

  try {
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
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const {
      date, marketBias, importantNews, plan, levels,
      scenarios, lessons, mistakes, tomorrowPlan, mood, rating
    } = body

    const entryDate = new Date(date)

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
