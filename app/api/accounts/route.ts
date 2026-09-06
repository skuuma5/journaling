import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
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
  try {
    const body = await req.json()
    const { name, initialBalance, currency, profitTarget, maxDrawdown, dailyLossLimit, accountType } = body

    // Always ensure a default user exists and get their actual ID
    const user = await prisma.user.upsert({
      where: { email: "trader@example.com" },
      update: {},
      create: {
        email: "trader@example.com",
        name: "Professional Trader",
      },
    })

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
