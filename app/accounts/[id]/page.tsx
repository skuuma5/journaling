@ts-nocheck
import prisma from "@/lib/prisma"
import { formatCurrency, cn } from "@/lib/utils"
import {
  ArrowLeft,
  TrendingUp,
  Activity,
  BarChart2,
  History,
  ShieldCheck
} from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { StatCard } from "@/components/StatCard"
import { format } from "date-fns"

// تعريف النوع الصريح للصفقة لضمان توافقه مع TypeScript
interface TradeItem {
  id: string;
  date: Date;
  symbol: string;
  direction: string;
  result: string | null;
  pnl: number | null;
  actualR: number | null;
}

async function getAccountData(id: string) {
  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      trades: {
        orderBy: { date: 'desc' }
      },
      snapshots: {
        orderBy: { date: 'asc' }
      },
      _count: {
        select: { trades: true }
      }
    }
  })

  if (!account) return null

  // تحديد نوع المصفوفة بشكل صريح لتجنب implicit any
  const allTrades = (account.trades || []) as TradeItem[];

  const wins = allTrades.filter((t: TradeItem) => t.result === 'WIN').length
  const winRate = allTrades.length > 0 ? (wins / allTrades.length) * 100 : 0

  const winners = allTrades.filter((t: TradeItem) => (t.pnl || 0) > 0)
  const losers = allTrades.filter((t: TradeItem) => (t.pnl || 0) < 0)

  const avgWin = winners.length > 0
    ? winners.reduce((sum: number, t: TradeItem) => sum + (t.pnl || 0), 0) / winners.length
    : 0

  const avgLoss = losers.length > 0
    ? Math.abs(losers.reduce((sum: number, t: TradeItem) => sum + (t.pnl || 0), 0) / losers.length)
    : 0

  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0

  const bestTrade = winners.length > 0 ? Math.max(...winners.map((t: TradeItem) => t.pnl || 0)) : 0
  const worstTrade = losers.length > 0 ? Math.min(...losers.map((t: TradeItem) => t.pnl || 0)) : 0

  const pnl = account.currentBalance - account.initialBalance
  const pnlPercent = (pnl / account.initialBalance) * 100

  return {
    account,
    stats: {
      pnl,
      pnlPercent,
      winRate,
      profitFactor,
      totalTrades: allTrades.length,
      avgR: allTrades.length > 0
        ? allTrades.reduce((sum: number, t: TradeItem) => sum + (t.actualR || 0), 0) / allTrades.length
        : 0,
      bestTrade,
      worstTrade,
      avgWin,
      avgLoss
    }
  }
}

export default async function AccountDetailPage({ params }: { params: { id: string } }) {
  const data = await getAccountData(params.id)

  if (!data) {
    notFound()
  }

  const { account, stats } = data

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-4">
          <Link href="/accounts" className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                account.status === "HEALTHY" ? "bg-success shadow-[0_0_8px_#10b981]" : "bg-danger"
              )} />
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{account.accountType}</span>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{account.name}</h2>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href={`/accounts/${account.id}/edit`} className="bg-neutral-900 border border-border text-white px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors">
            Edit Terminal
          </Link>
          <Link href="/trades/new" className="bg-white text-black px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95">
            Log Execution
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard label="Net Balance" value={formatCurrency(account.currentBalance, account.currency)} trend="neutral" />
        <StatCard label="Total Delta" value={`${stats.pnl >= 0 ? "+" : ""}${formatCurrency(stats.pnl, account.currency)}`} subValue={`${stats.pnlPercent.toFixed(2)}%`} trend={stats.pnl >= 0 ? "up" : "down"} />
        <StatCard label="Accuracy" value={`${stats.winRate.toFixed(1)}%`} trend="neutral" />
        <StatCard label="PF" value={stats.profitFactor.toFixed(2)} trend="neutral" />
        <StatCard label="Avg R" value={stats.avgR.toFixed(2)} trend="neutral" />
        <StatCard label="Executions" value={stats.totalTrades} trend="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card border border-border rounded-xl p-6 shadow-2xl relative overflow-hidden">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] mb-6 flex items-center gap-2 text-neutral-400">
              <BarChart2 className="w-4 h-4" />
              Terminal Equity Curve
            </h3>
            <div className="h-[350px] w-full bg-neutral-950/50 rounded-lg border border-border flex items-center justify-center relative">
               <TrendingUp className="w-12 h-12 text-success opacity-5" />
               <span className="absolute bottom-4 left-4 text-[10px] font-mono text-muted-foreground uppercase opacity-50">Secure Data Stream Active</span>
            </div>
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border bg-neutral-900/20 flex justify-between items-center">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2 text-neutral-400">
                <History className="w-4 h-4" />
                Execution History
              </h3>
              <Link href={`/trades?accountId=${account.id}`} className="text-[10px] font-black text-muted-foreground hover:text-white uppercase tracking-widest transition-colors">Log View</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] uppercase tracking-widest text-neutral-500 border-b border-border bg-neutral-900/10">
                    <th className="px-6 py-4">Timestamp</th>
                    <th className="px-6 py-4">Asset</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4 text-right">P&L</th>
                    <th className="px-6 py-4 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {account.trades.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-xs text-muted-foreground italic uppercase tracking-widest opacity-50">No terminal executions recorded</td>
                    </tr>
                  ) : (
                    account.trades.slice(0, 10).map((trade: any) => (
                      <tr key={trade.id} className="hover:bg-neutral-900/30 transition-all group">
                        <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold text-neutral-500 group-hover:text-neutral-300">
                          {format(new Date(trade.date), 'MMM d, HH:mm')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-black text-sm tracking-tight">
                          {trade.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={cn(
                            "text-[9px] font-black px-1.5 py-0.5 rounded tracking-tighter",
                            trade.direction === "BUY" ? "bg-success/5 text-success border border-success/20" : "bg-danger/5 text-danger border border-danger/20"
                          )}>
                            {trade.direction}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-black text-sm tracking-tighter">
                          <span className={(trade.pnl || 0) >= 0 ? "text-success" : "text-danger"}>
                            {(trade.pnl || 0) >= 0 ? "+" : ""}{formatCurrency(trade.pnl || 0, account.currency)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={cn(
                            "text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest",
                            trade.result === "WIN" ? "bg-success text-white" : "bg-danger text-white"
                          )}>
                            {trade.result}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-2xl">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2 text-neutral-400">
              <ShieldCheck className="w-4 h-4" />
              Risk Thresholds
            </h3>

            <div className="space-y-6">
               {account.profitTarget && (
                 <div className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                       <span>Profit Target</span>
                       <span className="text-white tabular-nums">{formatCurrency(account.profitTarget, account.currency)}</span>
                    </div>
                    <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-border/50">
                       <div className="h-full bg-success transition-all duration-1000 shadow-[0_0_10px_#10b981]" style={{ width: `${Math.min(100, Math.max(0, (stats.pnl / account.profitTarget) * 100))}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                       <span className="text-success">{Math.max(0, (stats.pnl / account.profitTarget) * 100).toFixed(1)}% Completed</span>
                       <span className="text-neutral-500">{formatCurrency(Math.max(0, account.profitTarget - stats.pnl), account.currency)} REMAINING</span>
                    </div>
                 </div>
               )}

               <div className="space-y-3 pt-2 border-t border-border/50">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                     <span>Max Drawdown</span>
                     <span className="text-white tabular-nums">{account.maxDrawdown ? formatCurrency(account.maxDrawdown, account.currency) : "N/A"}</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden border border-border/50">
                     <div className="h-full bg-danger transition-all duration-1000" style={{ width: `${Math.min(100, Math.max(0, (Math.abs(Math.min(0, stats.pnl)) / (account.maxDrawdown || 1000)) * 100))}%` }} />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
