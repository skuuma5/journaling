import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createClient } from '@/lib/supabase-server'
import { format, getHours } from "date-fns"

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')

  try {
    const tradeWhere: any = {
      account: { userId: user.id }
    }

    if (accountId && accountId !== 'all') {
      tradeWhere.accountId = accountId
    }

    const trades = await prisma.trade.findMany({
      where: tradeWhere,
      include: {
        account: true,
        strategy: true,
        mistakes: true,
      },
      orderBy: { date: 'asc' }
    })

    if (trades.length === 0) {
      return NextResponse.json({ isEmpty: true })
    }

    // 1. Starting Balance
    let startingBalance = 0
    if (accountId && accountId !== 'all') {
      const acc = await prisma.account.findUnique({ where: { id: accountId } })
      startingBalance = acc?.initialBalance || 0
    } else {
      const userAccounts = await prisma.account.findMany({ where: { userId: user.id } })
      startingBalance = userAccounts.reduce((sum, a) => sum + a.initialBalance, 0)
    }

    // 2. Data Aggregators
    const symbolData: Record<string, number> = {}
    const sessionData: Record<string, { pnl: number, count: number }> = {
      'ASIA': { pnl: 0, count: 0 },
      'LONDON': { pnl: 0, count: 0 },
      'NY': { pnl: 0, count: 0 }
    }
    const hourData: Record<number, number> = {}
    const dayOfWeekData: Record<string, number> = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0 }
    const strategyData: Record<string, number> = {}
    const mistakeData: Record<string, { count: number, loss: number }> = {}

    for (let i = 0; i < 24; i++) hourData[i] = 0

    let runningBalance = startingBalance
    const equityCurve = trades.map(t => {
      const pnl = t.pnl || 0
      runningBalance += pnl

      symbolData[t.symbol] = (symbolData[t.symbol] || 0) + pnl

      if (t.session) {
        const session = t.session.toUpperCase()
        if (sessionData[session]) {
          sessionData[session].pnl += pnl
          sessionData[session].count += 1
        } else {
          sessionData[session] = { pnl, count: 1 }
        }
      }

      const hour = getHours(new Date(t.date))
      hourData[hour] += pnl

      const day = format(new Date(t.date), 'eee')
      if (dayOfWeekData[day] !== undefined) dayOfWeekData[day] += pnl

      const sName = t.strategy?.name || 'No Strategy'
      strategyData[sName] = (strategyData[sName] || 0) + pnl

      t.mistakes.forEach(m => {
        if (!mistakeData[m.name]) mistakeData[m.name] = { count: 0, loss: 0 }
        mistakeData[m.name].count++
        if (pnl < 0) mistakeData[m.name].loss += pnl
      })

      return { date: format(new Date(t.date), 'MMM d'), balance: runningBalance }
    })

    return NextResponse.json({
      equityCurve,
      winRate: (trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100,
      totalTrades: trades.length,
      pnlByDay: Object.entries(dayOfWeekData).map(([day, pnl]) => ({ day, pnl })),
      pnlBySymbol: Object.entries(symbolData).map(([name, pnl]) => ({ name, pnl })).sort((a, b) => b.pnl - a.pnl),
      sessionStats: Object.entries(sessionData).map(([name, stats]) => ({ name, ...stats })),
      pnlByHour: Object.entries(hourData).map(([hour, pnl]) => ({ hour: `${hour}:00`, pnl })),
      byStrategy: Object.entries(strategyData).map(([name, pnl]) => ({ name, pnl })).sort((a, b) => b.pnl - a.pnl),
      byMistake: Object.entries(mistakeData).map(([name, data]) => ({ name, ...data })).sort((a, b) => a.loss - b.loss),
      isEmpty: false
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to process analytics" }, { status: 500 })
  }
}
