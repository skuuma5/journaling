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
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { trades: true }
        }
      }
    })
    return NextResponse.json(accounts)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 })
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
    const { name, initialBalance, currency, profitTarget, maxDrawdown, dailyLossLimit, accountType } = body

    const account = await prisma.account.create({
      data: {
        name,
        initialBalance: parseFloat(initialBalance) || 0,
        currentBalance: parseFloat(initialBalance) || 0,
        currency: currency || "USD",
        profitTarget: profitTarget ? parseFloat(profitTarget) : null,
        maxDrawdown: maxDrawdown ? parseFloat(maxDrawdown) : null,
        dailyLossLimit: dailyLossLimit ? parseFloat(dailyLossLimit) : null,
        accountType,
        userId: user.id,
      }
    })

    return NextResponse.json(account)
  } catch (error) {
    console.error("ACCOUNT_CREATE_ERROR", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
