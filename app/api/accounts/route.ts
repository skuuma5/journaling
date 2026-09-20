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
    // In dev, try to ensure at least one user exists
    const existingUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email || 'dev@local.com',
          name: 'Trader',
        }
      })
    }

    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: { trades: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(accounts)
  } catch (error: any) {
    console.error("ACCOUNTS_GET_ERROR", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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

    if (!name) {
      return NextResponse.json({ error: "Account name is required" }, { status: 400 })
    }

    // Ensure user exists in Prisma
    const existingUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!existingUser) {
      await prisma.user.create({
        data: {
          id: user.id,
          email: user.email || 'dev@local.com',
          name: 'Trader',
        }
      })
    }

    // Robust number parsing
    const parsedBalance = parseFloat(String(initialBalance)) || 0
    const parsedTarget = profitTarget ? parseFloat(String(profitTarget)) : null
    const parsedDrawdown = maxDrawdown ? parseFloat(String(maxDrawdown)) : null
    const parsedDailyLoss = dailyLossLimit ? parseFloat(String(dailyLossLimit)) : null

    const account = await prisma.account.create({
      data: {
        name,
        initialBalance: parsedBalance,
        currentBalance: parsedBalance,
        currency: currency || "USD",
        profitTarget: parsedTarget,
        maxDrawdown: parsedDrawdown,
        dailyLossLimit: parsedDailyLoss,
        accountType: accountType || "EVALUATION",
        userId: user.id,
      }
    })

    return NextResponse.json(account)
  } catch (error: any) {
    console.error("ACCOUNT_CREATE_ERROR", error)
    // Return specific error message for debugging
    return NextResponse.json({
      error: error.message || "Database error",
      details: error.code === 'P2002' ? "Unique constraint failed" : undefined
    }, { status: 500 })
  }
}
