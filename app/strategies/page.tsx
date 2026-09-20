import prisma from "@/lib/prisma"
import { formatCurrency, cn } from "@/lib/utils"
import { Target, BarChart2, Zap } from "lucide-react"
import Link from "next/link"
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

interface StrategyWithTrades {
  id: string;
  name: string;
  description: string | null;
  trades: {
    pnl: number | null;
    result: string | null;
    actualR: number | null;
  }[];
}

async function getStrategies() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const strategies = await prisma.strategy.findMany({
    where: { userId: user.id },
    include: {
      trades: {
        select: {
          pnl: true,
          result: true,
          actualR: true
        }
      }
    }
  })

  return strategies.map((s: any) => {
    const totalTrades = s.trades.length
    const wins = s.trades.filter((t: any) => (t.pnl || 0) > 0).length
    const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0
    const totalPnl = s.trades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0)
    const avgR = totalTrades > 0 ? s.trades.reduce((sum: number, t: any) => sum + (t.actualR || 0), 0) / totalTrades : 0

    return {
      ...s,
      totalTrades,
      winRate,
      totalPnl,
      avgR
    }
  }).sort((a: any, b: any) => b.totalPnl - a.totalPnl)
}

export default async function StrategiesPage() {
  const strategies = await getStrategies()

  if (strategies === null) {
    redirect('/login')
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Systematic Strategies</h2>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Analyze and deploy your trading models.</p>
        </div>
        <Link
          href="/strategies/new"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95"
        >
          <Zap className="w-4 h-4" />
          Deploy New Strategy
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {strategies.map((strategy) => (
          <div key={strategy.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-neutral-700 transition-all group shadow-2xl">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">{strategy.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{strategy.description || "Systematic trading setup"}</p>
                </div>
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center bg-secondary border border-border/50 shadow-inner",
                  strategy.totalPnl >= 0 ? "text-success" : "text-danger"
                )}>
                  <Target className="w-5 h-5" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-950 border border-border/30 p-3 rounded-lg">
                  <p className="text-[9px] text-neutral-500 uppercase font-black tracking-widest mb-1">Win Rate</p>
                  <p className="text-lg font-black text-white tabular-nums">{strategy.winRate.toFixed(1)}%</p>
                </div>
                <div className="bg-neutral-950 border border-border/30 p-3 rounded-lg">
                  <p className="text-[9px] text-neutral-500 uppercase font-black tracking-widest mb-1">Avg R</p>
                  <p className="text-lg font-black text-white tabular-nums">{strategy.avgR.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-neutral-500">Cumulative Delta</span>
                    <span className={cn("font-black", strategy.totalPnl >= 0 ? "text-success" : "text-danger")}>
                      {strategy.totalPnl >= 0 ? "+" : ""}{formatCurrency(strategy.totalPnl)}
                    </span>
                 </div>
                 <div className="w-full bg-neutral-900 rounded-full h-1 border border-border/50 overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-1000", strategy.totalPnl >= 0 ? "bg-success" : "bg-danger")}
                      style={{ width: `${Math.min(100, (Math.abs(strategy.totalPnl) / 1000) * 100)}%` }}
                    />
                 </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-border/50">
                 <div className="flex items-center gap-2">
                    <div className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">Dataset</div>
                    <div className="text-xs font-black text-white uppercase">{strategy.totalTrades} Executions</div>
                 </div>
                 <Link href={`/trades?strategy=${strategy.id}`} className="text-[10px] font-black text-muted-foreground hover:text-white flex items-center gap-1 group transition-colors uppercase tracking-widest">
                    Log View <BarChart2 className="w-3 h-3 transition-transform group-hover:scale-110" />
                 </Link>
              </div>
            </div>
          </div>
        ))}

        {strategies.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-neutral-900/10">
             <Target className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
             <h3 className="text-xl font-black text-white uppercase tracking-tighter">No strategies archived</h3>
             <p className="text-muted-foreground mb-8 uppercase text-[10px] font-black tracking-widest">Start tagging your trades to generate edge analytics.</p>
             <Link href="/strategies/new" className="bg-white text-black px-8 py-3 rounded-md text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-all">
                Initialize First Strategy
             </Link>
          </div>
        )}
      </div>
    </div>
  )
}
