import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { format } from "date-fns"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')

  try {
    const tradeWhere = accountId && accountId !== 'all' ? { accountId } : {}

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

    // Get initial balance(s) for the equity curve
    let startingBalance = 0
    if (accountId && accountId !== 'all') {
      const acc = await prisma.account.findUnique({ where: { id: accountId } })
      startingBalance = acc?.initialBalance || 0
    } else {
      const allAccs = await prisma.account.findMany()
      startingBalance = allAccs.reduce((sum, a) => sum + a.initialBalance, 0)
    }

    // 1. Equity Curve (Cumulative P&L)
    let runningBalance = startingBalance
    const equityCurve = trades.map(t => {
      runningBalance += (t.pnl || 0)
      return {
        date: format(new Date(t.date), 'MMM d'),
        balance: runningBalance
      }
    })

    // 2. P&L by Day of Week
    const pnlByDay: Record<string, number> = {
      'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0
    }
    trades.forEach(t => {
      const day = format(new Date(t.date), 'eee')
      if (pnlByDay[day] !== undefined) {
        pnlByDay[day] += (t.pnl || 0)
      }
    })
    const pnlByDayChart = Object.entries(pnlByDay).map(([day, pnl]) => ({ day, pnl }))

    // 3. Win Rate (Real Data: P&L > 0)
    const winningTrades = trades.filter(t => (t.pnl || 0) > 0)
    const winRate = (winningTrades.length / trades.length) * 100

    // 4. Strategy Performance
    const strategyPerf: Record<string, { name: string, pnl: number }> = {}
    trades.forEach(t => {
      const name = t.strategy?.name || 'No Strategy'
      if (!strategyPerf[name]) strategyPerf[name] = { name, pnl: 0 }
      strategyPerf[name].pnl += (t.pnl || 0)
    })

    // 5. Mistake Impact
    const mistakeImpact: Record<string, { name: string, count: number, loss: number }> = {}
    trades.forEach(t => {
      t.mistakes.forEach(m => {
        if (!mistakeImpact[m.name]) mistakeImpact[m.name] = { name: m.name, count: 0, loss: 0 }
        mistakeImpact[m.name].count++
        if ((t.pnl || 0) < 0) {
          mistakeImpact[m.name].loss += (t.pnl || 0)
        }
      })
    })

    // Additional Performance Stats
    const sumGains = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const losingTrades = trades.filter(t => (t.pnl || 0) < 0)
    const sumLosses = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))
    const profitFactor = sumLosses > 0 ? sumGains / sumLosses : sumGains > 0 ? 99 : 0

    return NextResponse.json({
      equityCurve,
      pnlByDay: pnlByDayChart,
      winRate,
      profitFactor,
      totalTrades: trades.length,
      byStrategy: Object.values(strategyPerf).sort((a, b) => b.pnl - a.pnl),
      byMistake: Object.values(mistakeImpact).sort((a, b) => a.loss - b.loss),
      isEmpty: false
    })
  } catch (error) {
    console.error("ANALYTICS_ERROR", error)
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 })
  }
}
