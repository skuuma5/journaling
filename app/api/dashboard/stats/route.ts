import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { format, subDays, startOfDay } from "date-fns"
import { createClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')

    // 0. Ensure user exists in Prisma
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        update: { email: user.email || 'dev@local.com' },
        create: {
          id: user.id,
          email: user.email || 'dev@local.com',
          name: 'Trader',
        }
      })
    } catch (upsertError) {
      console.error("USER_SYNC_ERROR:", upsertError)
    }

    // 1. Get User's Accounts
    const allAccounts = await prisma.account.findMany({
      where: { userId: user.id },
      include: {
        trades: {
          include: { strategy: true, mistakes: true }
        }
      }
    })

    if (!allAccounts || allAccounts.length === 0) {
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

    if (selectedAccounts.length === 0 && isFiltered) {
        // Handle case where filtered account doesn't exist
        return NextResponse.json({ error: "Selected account not found" }, { status: 404 })
    }

    const trades = selectedAccounts
      .flatMap(a => a.trades || [])
      .filter(t => t.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // 3. KPI Calculations
    const totalBalance = selectedAccounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0)
    const totalInitialBalance = selectedAccounts.reduce((sum, a) => sum + (a.initialBalance || 0), 0)
    const totalPnl = totalBalance - totalInitialBalance

    const winners = trades.filter(t => (t.pnl || 0) > 0)
    const losers = trades.filter(t => (t.pnl || 0) < 0)
    const winRate = trades.length > 0 ? (winners.length / trades.length) * 100 : 0

    const sumGains = winners.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const sumLosses = Math.abs(losers.reduce((sum, t) => sum + (t.pnl || 0), 0))
    const profitFactor = sumLosses > 0 ? sumGains / sumLosses : sumGains > 0 ? 9.99 : 0

    // Today's P&L
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayPnl = trades
      .filter(t => t.date && new Date(t.date) >= startOfToday)
      .reduce((sum, t) => sum + (t.pnl || 0), 0)

    // 4. Equity Curve
    let eb = isFiltered ? (selectedAccounts[0]?.initialBalance || 0) : totalInitialBalance
    const equityCurve = trades.map(t => {
      eb += (t.pnl || 0)
      let dateLabel = 'Unknown'
      try {
        const d = new Date(t.date)
        if (!isNaN(d.getTime())) {
          dateLabel = format(d, 'MMM d')
        }
      } catch (e) {}

      return {
        date: dateLabel,
        balance: eb
      }
    })

    if (equityCurve.length === 0) {
      equityCurve.push({
        date: format(new Date(), 'MMM d'),
        balance: isFiltered ? (selectedAccounts[0]?.initialBalance || 0) : totalInitialBalance
      })
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

    if (topStrategy && topStrategy.total > 0) {
      (topStrategy as any).winRate = (topStrategy.wins / topStrategy.total) * 100
    }

    // 6. Capital Leakage (Top Mistake)
    const mistakeStats: Record<string, { name: string, totalLoss: number, count: number }> = {}
    trades.forEach(t => {
      if (t.mistakes && Array.isArray(t.mistakes)) {
        t.mistakes.forEach(m => {
          if (!mistakeStats[m.id]) mistakeStats[m.id] = { name: m.name, totalLoss: 0, count: 0 }
          mistakeStats[m.id].count++
          if ((t.pnl || 0) < 0) mistakeStats[m.id].totalLoss += Math.abs(t.pnl || 0)
        })
      }
    })
    const topMistake = Object.values(mistakeStats).sort((a, b) => b.totalLoss - a.totalLoss)[0] || null

    // 7. Heatmap Data (Daily PNL)
    const heatmapData: Record<string, number> = {}
    for (let i = 0; i < 28; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
      heatmapData[date] = 0
    }
    trades.forEach(t => {
      try {
        const d = new Date(t.date)
        if (!isNaN(d.getTime())) {
          const dateStr = format(d, 'yyyy-MM-dd')
          if (heatmapData[dateStr] !== undefined) {
            heatmapData[dateStr] += (t.pnl || 0)
          }
        }
      } catch (e) {}
    })

    // 8. Max Drawdown Calculation
    let startingEquity = isFiltered ? (selectedAccounts[0]?.initialBalance || 0) : totalInitialBalance
    let peak = startingEquity
    let runningBalance = startingEquity
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
        maxDrawdown: parseFloat(maxDD.toFixed(1))
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
  } catch (error: any) {
    console.error("DASHBOARD_STATS_ERROR:", error)
    return NextResponse.json({
      error: `Dashboard Error: ${error.message || "Unknown error"}`
    }, { status: 500 })
  }
}
