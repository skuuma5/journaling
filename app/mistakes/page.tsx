import prisma from "@/lib/prisma"
import { formatCurrency, cn } from "@/lib/utils"
import { AlertCircle, TrendingDown, Info, BarChart3, Scissors } from "lucide-react"

async function getMistakes() {
  const mistakes = await prisma.mistake.findMany({
    include: {
      trades: {
        select: {
          pnl: true,
          result: true,
          actualR: true,
          account: {
            select: {
              currency: true
            }
          }
        }
      }
    }
  })

  return mistakes.map(m => {
    const totalTrades = m.trades.length
    const totalLoss = m.trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    const avgLoss = totalTrades > 0 ? totalLoss / totalTrades : 0

    return {
      ...m,
      totalTrades,
      totalLoss,
      avgLoss
    }
  }).sort((a, b) => a.totalLoss - b.totalLoss) // Most negative first
}

export default async function MistakesPage() {
  const mistakes = await getMistakes()

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white">Mistake Tracker</h2>
          <p className="text-muted-foreground">Identify and eliminate behavioral errors costing you money.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mistakes.map((mistake) => (
          <div key={mistake.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-danger/30 transition-all group">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-white">{mistake.name}</h3>
                  <p className="text-xs text-muted-foreground">{mistake.description || "Behavioral trading error"}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-danger/10 text-danger">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Total P&L Impact</p>
                    <p className={cn("text-2xl font-black", mistake.totalLoss <= 0 ? "text-danger" : "text-success")}>
                      {mistake.totalLoss >= 0 ? "+" : ""}{formatCurrency(mistake.totalLoss)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Occurrences</p>
                    <p className="text-lg font-bold text-white">{mistake.totalTrades}</p>
                  </div>
                </div>

                <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-border">
                  <div
                    className="h-full bg-danger transition-all"
                    style={{ width: `${Math.min(100, (Math.abs(mistake.totalLoss) / 1000) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <TrendingDown className="w-3 h-3 text-danger" />
                    <span className="text-xs text-muted-foreground">Avg. Impact: <span className="text-white font-bold">{formatCurrency(mistake.avgLoss)}</span></span>
                 </div>
                 <button className="text-[10px] font-bold text-muted-foreground hover:text-white uppercase tracking-widest">
                   Analyze Trades
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-8">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center text-success">
              <Scissors className="w-6 h-6" />
           </div>
           <div>
              <h3 className="text-xl font-bold text-white">Edge through Elimination</h3>
              <p className="text-sm text-muted-foreground">Removing your top 3 mistakes would have saved you <span className="text-success font-bold">$840.00</span> this month.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-neutral-900/30 p-6 rounded-lg border border-border space-y-4">
              <h4 className="font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                Impact Analysis
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Most of your losses are coming from <strong>FOMO</strong>. This typically happens during the first 30 minutes of the NY session. Consider implementing a "wait 15 mins" rule before your first execution.
              </p>
           </div>
           <div className="bg-neutral-900/30 p-6 rounded-lg border border-border space-y-4">
              <h4 className="font-bold flex items-center gap-2">
                <Info className="w-4 h-4 text-yellow-500" />
                Actionable Step
              </h4>
              <p className="text-xs text-neutral-400 leading-relaxed">
                You have a 100% loss rate when you <strong>Move SL</strong> to breakeven too early. Review your trade management rules and stick to the original plan until the first profit target is hit.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}
