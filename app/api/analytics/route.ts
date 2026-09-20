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

    // Starting Balance
    let totalInitialBalance = 0
    if (accountId && accountId !== 'all') {
      const acc = await prisma.account.findUnique({ where: { id: accountId } })
      totalInitialBalance = acc?.initialBalance || 0
    } else {
      const userAccounts = await prisma.account.findMany({ where: { userId: user.id } })
      totalInitialBalance = userAccounts.reduce((sum, a) => sum + a.initialBalance, 0)
    }

    // Data Aggregators
    const sessionData: Record<string, { pnl: number, count: number }> = {
      'ASIA': { pnl: 0, count: 0 },
      'LONDON': { pnl: 0, count: 0 },
      'NY': { pnl: 0, count: 0 }
    }
    const dayOfWeekData: Record<string, number> = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0 }
    const strategyData: Record<string, number> = {}
    const mistakeData: Record<string, { count: number, loss: number }> = {}

    let runningBalance = totalInitialBalance
    const equityCurve = trades.map(t => {
      const pnl = t.pnl || 0
      runningBalance += pnl

      // Group by Session
      if (t.session) {
        const s = t.session.toUpperCase()
        if (sessionData[s]) {
          sessionData[s].pnl += pnl
          sessionData[s].count++
        }
      }

      // Group by Day
      const day = format(new Date(t.date), 'eee')
      if (dayOfWeekData[day] !== undefined) dayOfWeekData[day] += pnl

      // Group by Strategy
      const sName = t.strategy?.name || 'No Strategy'
      strategyData[sName] = (strategyData[sName] || 0) + pnl

      // Group by Mistakes - Fix: Ensure all mistakes are counted
      t.mistakes.forEach(m => {
        if (!mistakeData[m.name]) mistakeData[m.name] = { count: 0, loss: 0 }
        mistakeData[m.name].count++
        if (pnl < 0) mistakeData[m.name].loss += Math.abs(pnl)
      })

      return { date: format(new Date(t.date), 'MMM d'), balance: runningBalance }
    })

    return NextResponse.json({
      equityCurve,
      winRate: (trades.filter(t => (t.pnl || 0) > 0).length / trades.length) * 100,
      totalTrades: trades.length,
      pnlByDay: Object.entries(dayOfWeekData).map(([day, pnl]) => ({ day, pnl })),
      sessionStats: Object.entries(sessionData).map(([name, stats]) => ({ name, ...stats })),
      byStrategy: Object.entries(strategyData).map(([name, pnl]) => ({ name, pnl })).sort((a, b) => b.pnl - a.pnl),
      byMistake: Object.entries(mistakeData).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.loss - a.loss),
      isEmpty: false
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process analytics" }, { status: 500 })
  }
}
