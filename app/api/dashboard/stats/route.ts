import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { format, subDays, startOfDay } from "date-fns"

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')

  try {
    // 1. Get All Accounts for calculations and selector
    const allAccounts = await prisma.account.findMany({
      include: {
        trades: {
          include: { strategy: true, mistakes: true }
        }
      }
    })

    if (allAccounts.length === 0) {
      return NextResponse.json({
        stats: { totalBalance: 0, totalPnl: 0, winRate: 0, profitFactor: 0, todayPnl: 0, totalTrades: 0, maxDrawdown: 0 },
        accounts: [],
        recentTrades: [],
        equityCurve: [{ date: format(new Date(), 'MMM d'), balance: 0 }],
        topStrategy: null,
        topMistake: null,
        heatmapData: {},
        isEmpty: true
      })
    }

    // 2. Filter data based on selection
    const isFiltered = accountId && accountId !== 'all'
    const selectedAccounts = isFiltered
      ? allAccounts.filter(a => a.id === accountId)
      : allAccounts

    const trades = selectedAccounts
      .flatMap(a => a.trades)
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    // 3. KPI Calculations
    const totalBalance = selectedAccounts.reduce((sum, a) => sum + a.currentBalance, 0)
    const totalInitialBalance = selectedAccounts.reduce((sum, a) => sum + a.initialBalance, 0)
    const totalPnl = totalBalance - totalInitialBalance

    const winners = trades.filter(t => (t.pnl || 0) > 0)
    const losers = trades.filter(t => (t.pnl || 0) < 0)
    const winRate = trades.length > 0 ? (winners.length / trades.length) * 100 : 0

    const sumGains = winners.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const sumLosses = Math.abs(losers.reduce((sum, t) => sum + (t.pnl || 0), 0))
    const profitFactor = sumLosses > 0 ? sumGains / sumLosses : sumGains > 0 ? 9.99 : 0

    // Today's P&L
    const startOfToday = startOfDay(new Date())
    const todayPnl = trades
      .filter(t => new Date(t.date) >= startOfToday)
      .reduce((sum, t) => sum + (t.pnl || 0), 0)

    // 4. Equity Curve
    let eb = totalInitialBalance
    const equityCurve = trades.map(t => {
      eb += (t.pnl || 0)
      return {
        date: format(new Date(t.date), 'MMM d'),
        balance: eb
      }
    })
    if (equityCurve.length === 0) {
      equityCurve.push({ date: format(new Date(), 'MMM d'), balance: totalInitialBalance })
    }

    // 5. Peak Performance (Top Strategy)
    const strategyStats: Record<string, { name: string, pnl: number, wins: number, total: number }> = {}
    trades.forEach(t => {
      if (t.strategy) {
        if (!strategyStats[t.strategy.id]) strategyStats[t.strategy.id] = { name: t.strategy.name, pnl: 0, wins: 0, total: 0 }
        strategyStats[t.strategy.id].total++
        strategyStats[t.strategy.id].pnl += (t.pnl || 0)
        if ((t.pnl || 0) > 0) strategyStats[t.strategy.id].wins++
      }
    })
    const topStrategy = Object.values(strategyStats)
      .sort((a, b) => b.pnl - a.pnl)[0] || null
    if (topStrategy) {
      (topStrategy as any).winRate = (topStrategy.wins / topStrategy.total) * 100
    }

    // 6. Capital Leakage (Top Mistake)
    const mistakeStats: Record<string, { name: string, totalLoss: number, count: number }> = {}
    trades.forEach(t => {
      t.mistakes.forEach(m => {
        if (!mistakeStats[m.id]) mistakeStats[m.id] = { name: m.name, totalLoss: 0, count: 0 }
        mistakeStats[m.id].count++
        if ((t.pnl || 0) < 0) mistakeStats[m.id].totalLoss += Math.abs(t.pnl || 0)
      })
    })
    const topMistake = Object.values(mistakeStats).sort((a, b) => b.totalLoss - a.totalLoss)[0] || null

    // 7. Heatmap Data (Daily PNL)
    const heatmapData: Record<string, number> = {}
    for (let i = 0; i < 28; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
      heatmapData[date] = 0
    }
    trades.forEach(t => {
      const date = format(new Date(t.date), 'yyyy-MM-dd')
      if (heatmapData[date] !== undefined) {
        heatmapData[date] += (t.pnl || 0)
      }
    })

    // 8. Max Drawdown Calculation
    let peak = totalInitialBalance
    let runningBalance = totalInitialBalance
    let maxDD = 0
    trades.forEach(t => {
      runningBalance += (t.pnl || 0)
      if (runningBalance > peak) peak = runningBalance
      const dd = peak > 0 ? ((peak - runningBalance) / peak) * 100 : 0
      if (dd > maxDD) maxDD = dd
    })

    return NextResponse.json({
      stats: {
        totalBalance,
        totalPnl,
        winRate,
        profitFactor,
        todayPnl,
        totalTrades: trades.length,
        maxDrawdown: -maxDD.toFixed(1)
      },
      accounts: allAccounts.map(a => ({
        id: a.id,
        name: a.name,
        balance: a.currentBalance,
        pnl: a.currentBalance - a.initialBalance,
        progress: a.profitTarget ? ((a.currentBalance - a.initialBalance) / a.profitTarget) * 100 : 0,
        status: a.status,
        accountType: a.accountType
      })),
      recentTrades: [...trades].reverse().slice(0, 5).map(t => ({
        id: t.id,
        symbol: t.symbol,
        direction: t.direction,
        pnl: t.pnl,
        result: (t.pnl || 0) > 0 ? "WIN" : (t.pnl || 0) < 0 ? "LOSS" : "BREAKEVEN",
        date: t.date,
        account: { name: allAccounts.find(acc => acc.id === t.accountId)?.name || 'Unknown' }
      })),
      equityCurve,
      topStrategy,
      topMistake,
      heatmapData,
      isEmpty: false
    })
  } catch (error) {
    console.error("DASHBOARD_STATS_ERROR", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
