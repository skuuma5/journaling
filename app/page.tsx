"use client"

import { useState, useEffect } from "react"
import { StatCard } from "@/components/StatCard"
import {
  TrendingUp,
  Activity,
  BarChart2,
  PlusCircle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar as CalendarIcon,
  Target,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { formatCurrency, cn } from "@/lib/utils"
import { getStatusColor } from "@/lib/account-logic"
import { EquityChart } from "@/components/EquityChart"
import { format } from "date-fns"

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAccountId, setSelectedAccountId] = useState("all")

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true)
      try {
        const res = await fetch(`/api/dashboard/stats?accountId=${selectedAccountId}`)
        const json = await res.json()
        setData(json)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [selectedAccountId])

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Syncing Terminal Data...</p>
      </div>
    )
  }

  const statsCards = [
    { label: "Total Balance", value: formatCurrency(data.stats.totalBalance), subValue: "Live", trend: "neutral" as const },
    { label: "Total P&L", value: `${data.stats.totalPnl >= 0 ? "+" : ""}${formatCurrency(data.stats.totalPnl)}`, subValue: "All Time", trend: data.stats.totalPnl >= 0 ? "up" as const : "down" as const },
    { label: "Win Rate", value: `${data.stats.winRate.toFixed(1)}%`, subValue: "Target 60%", trend: data.stats.winRate >= 60 ? "up" as const : "neutral" as const },
    { label: "Profit Factor", value: data.stats.profitFactor.toFixed(2), subValue: "Healthy", trend: data.stats.profitFactor >= 1.5 ? "up" as const : "neutral" as const },
    { label: "Max Drawdown", value: `${data.stats.maxDrawdown}%`, subValue: "Relative", trend: "neutral" as const },
    { label: "Trades", value: data.stats.totalTrades, subValue: "Executed", trend: "neutral" as const },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Terminal Dashboard</h2>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Monitoring {data.accounts.length} active trading accounts.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="flex-1 md:flex-none bg-card border border-border rounded-md px-4 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-white/20 uppercase tracking-widest cursor-pointer"
          >
            <option value="all">All Accounts</option>
            {data.accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <Link
            href="/trades/new"
            className="flex items-center justify-center gap-2 bg-white text-black px-6 py-2 rounded-md text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            New Trade
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((stat) => (
          <StatCard key={stat.label} {...stat} className="border-neutral-800 bg-neutral-900/20 shadow-lg" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Equity Curve Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-center z-10">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2 text-neutral-400">
              <BarChart2 className="w-4 h-4" />
              Equity Growth Distribution
            </h3>
          </div>
          <div className="h-[350px] w-full z-10">
             <EquityChart data={data.equityCurve} />
          </div>
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        </div>

        {/* Account Health Section */}
        <div className="bg-card border border-border rounded-xl p-6 flex flex-col gap-6 shadow-2xl">
          <h3 className="font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2 text-neutral-400">
            <Target className="w-4 h-4" />
            Terminal Health
          </h3>
          <div className="space-y-6 flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            {data.accounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                <Activity className="w-8 h-8 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-widest">No Active Terminals</p>
              </div>
            ) : (
              data.accounts.map((account: any) => (
                <Link href={`/accounts/${account.id}`} key={account.id} className="space-y-3 group block">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]", getStatusColor(account.status))} />
                      <div className="flex flex-col">
                        <span className="text-sm font-black tracking-tight group-hover:text-white transition-colors uppercase">{account.name}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{account.accountType}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "text-sm font-black",
                        account.pnl >= 0 ? "text-success" : "text-danger"
                      )}>
                        {account.pnl >= 0 ? "+" : ""}{formatCurrency(account.pnl)}
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-900/50 rounded-full h-1.5 border border-border/50 overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-1000", account.pnl >= 0 ? "bg-success" : "bg-danger")}
                      style={{ width: `${Math.min(100, Math.max(5, Math.abs(account.progress)))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-muted-foreground uppercase font-black tracking-widest">
                    <span>Target {account.progress.toFixed(1)}%</span>
                    <span>{formatCurrency(account.currentBalance)}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
          <Link href="/accounts" className="mt-auto pt-6 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-white transition-all group border-t border-border/50">
            Terminal Manager <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Trades Log */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-border bg-neutral-900/20 flex justify-between items-center">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2 text-neutral-400">
              <Activity className="w-4 h-4" />
              Recent Terminal Activity
            </h3>
            <Link href="/trades" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">Log View</Link>
          </div>
          <div className="divide-y divide-border">
            {data.recentTrades.length === 0 ? (
              <div className="p-10 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-30 italic">No executions recorded.</div>
            ) : (
              data.recentTrades.map((trade: any) => (
                <Link
                  href={`/trades/${trade.id}`}
                  key={trade.id}
                  className={cn(
                    "flex items-center justify-between p-5 hover:bg-neutral-900/40 transition-all border-l-2 group",
                    (trade.pnl || 0) >= 0 ? "border-transparent hover:border-success" : "border-transparent hover:border-danger"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-12 h-12 rounded flex flex-col items-center justify-center border transition-colors",
                      (trade.pnl || 0) >= 0
                        ? "bg-success/5 border-success/20 text-success group-hover:bg-success/10"
                        : "bg-danger/5 border-danger/20 text-danger group-hover:bg-danger/10"
                    )}>
                      <span className="text-[10px] font-black">{trade.direction}</span>
                    </div>
                    <div>
                      <p className="font-black text-base text-white tracking-tight uppercase">{trade.symbol}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">{trade.account.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {(trade.pnl || 0) >= 0 ? <ArrowUpRight className="w-3 h-3 text-success" /> : <ArrowDownRight className="w-3 h-3 text-danger" />}
                      <p className={cn(
                        "font-black text-base tracking-tighter",
                        (trade.pnl || 0) >= 0 ? "text-success" : "text-danger"
                      )}>
                        {(trade.pnl || 0) >= 0 ? "+" : ""}{formatCurrency(trade.pnl || 0)}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">{format(new Date(trade.date), 'MMM d, HH:mm')}</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Analytics Insights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-2xl hover:border-neutral-700 transition-colors">
              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500">Peak Performance</h4>
              <div className="mt-8">
                 <p className="text-2xl font-black text-white tracking-tighter uppercase truncate">{data.topStrategy?.name || "N/A"}</p>
                 <div className="flex items-center gap-2 mt-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full", data.topStrategy?.pnl >= 0 ? "bg-success shadow-[0_0_8px_#10b981]" : "bg-danger shadow-[0_0_8px_#ef4444]")} />
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", data.topStrategy?.pnl >= 0 ? "text-success" : "text-danger")}>
                        {data.topStrategy ? `${formatCurrency(data.topStrategy.pnl)} Realized` : "NO DATA"}
                    </span>
                 </div>
              </div>
           </div>
           <div className="bg-card border border-border rounded-xl p-6 flex flex-col justify-between shadow-2xl hover:border-neutral-700 transition-colors">
              <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500">Capital Leakage</h4>
              <div className="mt-8">
                 <p className="text-2xl font-black text-white tracking-tighter uppercase truncate">{data.topMistake?.name || "NONE"}</p>
                 <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-danger shadow-[0_0_8px_#ef4444]" />
                    <span className="text-danger text-[10px] font-black uppercase tracking-widest">
                        {data.topMistake ? `${formatCurrency(data.topMistake.totalLoss)} Loss` : "OPTIMAL PROCESS"}
                    </span>
                 </div>
              </div>
           </div>

           <div className="sm:col-span-2 bg-card border border-border rounded-xl p-6 shadow-2xl overflow-hidden relative group">
              <div className="flex justify-between items-center mb-6 z-10 relative">
                <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500 flex items-center gap-2">
                  <CalendarIcon className="w-3 h-3" />
                  Performance Heatmap
                </h4>
                <Link href="/calendar" className="text-[9px] font-black text-muted-foreground uppercase hover:text-white transition-colors">Full Calendar</Link>
              </div>
              <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 z-10 relative">
                {Array.from({ length: 28 }).map((_, i) => {
                  const dayDate = format(new Date(Date.now() - (27 - i) * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
                  const dayPnl = data.heatmapData[dayDate] || 0;

                  return (
                    <div
                      key={i}
                      className={cn(
                        "aspect-square rounded-sm border transition-all hover:scale-110 cursor-help",
                        dayPnl > 0 ? "bg-success/50 border-success/30 shadow-[0_0_5px_rgba(16,185,129,0.2)]" :
                        dayPnl < 0 ? "bg-danger/50 border-danger/30 shadow-[0_0_5px_rgba(239,68,68,0.2)]" :
                        "bg-neutral-900 border-border"
                      )}
                      title={`${dayPnl >= 0 ? '+' : ''}${formatCurrency(dayPnl)} on ${dayDate}`}
                    />
                  )
                })}
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
           </div>
        </div>
      </div>
    </div>
  )
}
