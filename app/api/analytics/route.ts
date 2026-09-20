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

    // 1. Starting Balance for Equity Curve
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
    const sessionData: Record<string, number> = { 'ASIA': 0, 'LONDON': 0, 'NY': 0 }
    const hourData: Record<number, number> = {}
    const dayOfWeekData: Record<string, number> = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0 }
    const strategyData: Record<string, number> = {}
    const mistakeData: Record<string, { count: number, loss: number }> = {}

    // Initialize hours
    for (let i = 0; i < 24; i++) hourData[i] = 0

    let runningBalance = startingBalance
    const equityCurve = trades.map(t => {
      const pnl = t.pnl || 0
      runningBalance += pnl

      // Group by Symbol
      symbolData[t.symbol] = (symbolData[t.symbol] || 0) + pnl

      // Group by Session
      if (t.session) sessionData[t.session] = (sessionData[t.session] || 0) + pnl

      // Group by Hour
      const hour = getHours(new Date(t.date))
      hourData[hour] += pnl

      // Group by Day
      const day = format(new Date(t.date), 'eee')
      if (dayOfWeekData[day] !== undefined) dayOfWeekData[day] += pnl

      // Group by Strategy
      const sName = t.strategy?.name || 'No Strategy'
      strategyData[sName] = (strategyData[sName] || 0) + pnl

      // Group by Mistakes
      t.mistakes.forEach(m => {
        if (!mistakeData[m.name]) mistakeData[m.name] = { count: 0, loss: 0 }
        mistakeImpact(mistakeData[m.name], pnl)
      })

      return { date: format(new Date(t.date), 'MMM d'), balance: runningBalance }
    })

    function mistakeImpact(obj: any, pnl: number) {
      obj.count++
      if (pnl < 0) obj.loss += pnl
    }

    return NextResponse.json({
      equityCurve,
      winRate: (trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100,
      totalTrades: trades.length,
      pnlByDay: Object.entries(dayOfWeekData).map(([day, pnl]) => ({ day, pnl })),
      pnlBySymbol: Object.entries(symbolData).map(([name, pnl]) => ({ name, pnl })).sort((a, b) => b.pnl - a.pnl),
      pnlBySession: Object.entries(sessionData).map(([name, pnl]) => ({ name, pnl })),
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
