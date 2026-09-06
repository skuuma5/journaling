"use client"

import { useEffect, useState } from "react"
import { StatCard } from "@/components/StatCard"
import { ShieldAlert, ShieldCheck, AlertTriangle, TrendingDown, Info, Loader2 } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"

export default function RiskManagementPage() {
  const [riskData, setRiskData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRisk() {
      try {
        const res = await fetch('/api/risk')
        const data = await res.json()
        setRiskData(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchRisk()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Scanning terminal risk...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Risk Management</h2>
        <p className="text-muted-foreground font-medium">Real-time capital protection and breach monitoring.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {riskData.length === 0 ? (
          <div className="col-span-full py-20 border border-dashed border-border rounded-xl text-center">
            <p className="text-muted-foreground">No accounts found for risk monitoring.</p>
          </div>
        ) : (
          riskData.map((account) => {
            const dailyRemaining = account.dailyLossLimit - account.todayLoss
            const ddRemaining = account.maxDrawdownLimit - account.currentDrawdown
            const dailyProgress = account.dailyLossLimit > 0 ? (account.todayLoss / account.dailyLossLimit) * 100 : 0
            const ddProgress = account.maxDrawdownLimit > 0 ? (account.currentDrawdown / account.maxDrawdownLimit) * 100 : 0

            const isWarning = account.status === "NEAR_BREACH" || dailyProgress > 80 || ddProgress > 80
            const isBreached = account.status === "BREACHED" || dailyProgress >= 100 || ddProgress >= 100

            return (
              <div key={account.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl transition-all hover:border-neutral-700">
                <div className={cn(
                  "p-5 border-b border-border flex justify-between items-center",
                  isBreached ? "bg-danger/20" : isWarning ? "bg-yellow-500/10" : "bg-neutral-900/50"
                )}>
                  <div className="flex items-center gap-3">
                    {isBreached || isWarning ? (
                      <ShieldAlert className={cn("w-5 h-5", isBreached ? "text-danger" : "text-yellow-500")} />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-success" />
                    )}
                    <h3 className="font-black text-sm text-white tracking-tight">{account.name}</h3>
                  </div>
                  <span className={cn(
                    "text-[10px] font-black px-2 py-1 rounded-sm uppercase tracking-widest",
                    isBreached ? "bg-danger text-white" :
                    isWarning ? "bg-yellow-500 text-black" : "bg-success/20 text-success"
                  )}>
                    {account.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-6 space-y-8">
                  {/* Daily Loss Monitor */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" /> Daily Loss Buffer
                        </p>
                        <p className="text-2xl font-black text-white tracking-tighter">
                          {formatCurrency(account.dailyLossLimit, account.currency)}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Available</p>
                        <p className={cn("text-xl font-bold tracking-tighter", dailyRemaining < (account.dailyLossLimit * 0.2) ? "text-danger" : "text-white")}>
                          {formatCurrency(Math.max(0, dailyRemaining), account.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="relative h-2 bg-neutral-900 rounded-full border border-border/50 overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-1000",
                          isBreached ? "bg-danger" : dailyProgress > 80 ? "bg-danger" : dailyProgress > 50 ? "bg-yellow-500" : "bg-success"
                        )}
                        style={{ width: `${Math.min(100, dailyProgress)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      <span>Consumed: {dailyProgress.toFixed(1)}%</span>
                      <span className={account.todayPnl < 0 ? "text-danger" : "text-success"}>
                        Today: {account.todayPnl >= 0 ? "+" : ""}{formatCurrency(account.todayPnl, account.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Max Drawdown Monitor */}
                  <div className="space-y-4 pt-6 border-t border-border">
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-yellow-500" /> Max Drawdown Allowance
                        </p>
                        <p className="text-2xl font-black text-white tracking-tighter">
                          {formatCurrency(account.maxDrawdownLimit, account.currency)}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Buffer Left</p>
                        <p className={cn("text-xl font-bold tracking-tighter", ddRemaining < (account.maxDrawdownLimit * 0.2) ? "text-danger" : "text-white")}>
                          {formatCurrency(Math.max(0, ddRemaining), account.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="relative h-2 bg-neutral-900 rounded-full border border-border/50 overflow-hidden">
                      <div
                        className={cn(
                          "h-full transition-all duration-1000",
                          isBreached ? "bg-danger" : ddProgress > 80 ? "bg-danger" : ddProgress > 50 ? "bg-yellow-500" : "bg-success"
                        )}
                        style={{ width: `${Math.min(100, ddProgress)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      <span>Drawdown: {ddProgress.toFixed(1)}%</span>
                      <span>{account.tradesToday} Trades Total</span>
                    </div>
                  </div>

                  {(isWarning || isBreached) && (
                    <div className={cn(
                      "p-4 rounded-lg flex gap-3 border animate-pulse",
                      isBreached ? "bg-danger/10 border-danger/20" : "bg-yellow-500/10 border-yellow-500/20"
                    )}>
                      <Info className={cn("w-5 h-5 shrink-0", isBreached ? "text-danger" : "text-yellow-500")} />
                      <p className={cn("text-[11px] leading-relaxed font-bold uppercase tracking-wide", isBreached ? "text-danger" : "text-yellow-500")}>
                        {isBreached
                          ? "CRITICAL: Breach detected. Stop all trading activities immediately and review account parameters."
                          : "WARNING: You are approaching critical risk thresholds. Implement defensive management immediately."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="bg-card border border-border rounded-xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <ShieldCheck className="w-32 h-32 text-white" />
        </div>
        <h3 className="font-black text-xs uppercase tracking-[0.3em] mb-8 text-neutral-400">Tactical Risk Protocols</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-border pb-2">Single Exposure</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
              Maximum risk per execution is capped at <span className="text-white font-bold">1.0%</span>. For high-volatility sessions (NY Open), reduce to <span className="text-white font-bold">0.5%</span>.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-border pb-2">Daily Thresholds</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
              At <span className="text-yellow-500 font-bold">50%</span> daily loss, cut trade size by half. At <span className="text-danger font-bold">80%</span>, terminal shutdown is mandatory.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-xs font-black text-white uppercase tracking-widest border-b border-border pb-2">Asset Correlation</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
              Avoid simultaneous exposure in correlated pairs (e.g. EURUSD/GBPUSD) to prevent unintended risk multiplication.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
