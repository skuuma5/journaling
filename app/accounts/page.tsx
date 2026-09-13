import { PlusCircle, CreditCard, Target, AlertTriangle, TrendingUp, History } from "lucide-react"
import prisma from "@/lib/prisma"
import { formatCurrency, cn } from "@/lib/utils"
import Link from "next/link"
import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

async function getAccounts() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  return await prisma.account.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: { trades: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

export default async function AccountsPage() {
  const accounts = await getAccounts()

  if (accounts === null) {
    redirect('/login')
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Terminals</h2>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Active trading accounts monitor.</p>
        </div>
        <Link
          href="/accounts/new"
          className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-md text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95 shadow-xl"
        >
          <PlusCircle className="w-4 h-4" />
          Create Terminal
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {accounts.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-border rounded-xl bg-card/50">
             <CreditCard className="w-12 h-12 text-neutral-800 mb-4" />
             <h3 className="text-xl font-black text-white uppercase tracking-tighter">No Active Terminals</h3>
             <p className="text-muted-foreground uppercase text-[10px] font-black tracking-widest mb-8">Deploy your first account to start tracking edge.</p>
             <Link
                href="/accounts/new"
                className="bg-white text-black px-8 py-3 rounded-md text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-lg"
              >
                Initialize Terminal
              </Link>
          </div>
        ) : (
          accounts.map((account) => {
            const pnl = account.currentBalance - account.initialBalance
            const pnlPercent = (pnl / account.initialBalance) * 100
            const progress = account.profitTarget ? (pnl / account.profitTarget) * 100 : 0

            return (
              <div key={account.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-neutral-700 transition-all group shadow-2xl">
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                          account.status === "HEALTHY" ? "bg-success" :
                          account.status === "WARNING" ? "bg-yellow-500" : "bg-danger"
                        )} />
                        <span className="text-[10px] font-black text-neutral-500 tracking-widest uppercase">{account.accountType}</span>
                      </div>
                      <h3 className="text-xl font-black text-white uppercase tracking-tight">{account.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-neutral-500 uppercase font-black mb-1">Net Balance</p>
                      <p className="text-2xl font-black text-white tabular-nums tracking-tighter">{formatCurrency(account.currentBalance, account.currency)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-950/50 p-4 rounded-lg border border-border/30">
                      <p className="text-[9px] text-neutral-500 uppercase font-black mb-1 tracking-widest">Total Delta</p>
                      <p className={cn("text-lg font-black tabular-nums tracking-tighter", pnl >= 0 ? "text-success" : "text-danger")}>
                        {pnl >= 0 ? "+" : ""}{formatCurrency(pnl, account.currency)}
                      </p>
                      <p className="text-[10px] font-bold text-neutral-600">{pnlPercent.toFixed(2)}%</p>
                    </div>
                    <div className="bg-neutral-950/50 p-4 rounded-lg border border-border/30">
                      <p className="text-[9px] text-neutral-500 uppercase font-black mb-1 tracking-widest">Dataset</p>
                      <p className="text-lg font-black text-white tabular-nums tracking-tighter">{account._count.trades}</p>
                      <p className="text-[10px] font-bold text-neutral-600 uppercase">Executions</p>
                    </div>
                  </div>

                  {account.profitTarget && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                        <span className="text-neutral-500 flex items-center gap-1">
                          <Target className="w-3 h-3" /> Profit Goal
                        </span>
                        <span className="text-white tabular-nums">{formatCurrency(account.profitTarget, account.currency)}</span>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden border border-border/50">
                        <div
                          className={cn("h-full transition-all duration-1000 shadow-[0_0_10px_#10b981]", pnl >= 0 ? "bg-success" : "bg-neutral-700")}
                          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                        <span>{Math.max(0, progress).toFixed(1)}% Secured</span>
                        <span>{formatCurrency(Math.max(0, account.profitTarget - pnl), account.currency)} Left</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-border p-4 bg-neutral-900/10 flex justify-between items-center group-hover:bg-neutral-900/30 transition-colors">
                  <Link href={`/accounts/${account.id}`} className="text-[10px] font-black text-neutral-400 hover:text-white flex items-center gap-2 uppercase tracking-widest transition-colors">
                    <History className="w-3.5 h-3.5" /> Data Stream
                  </Link>
                  <div className="flex gap-4">
                     <Link href={`/accounts/${account.id}/edit`} className="text-[10px] font-black text-neutral-400 hover:text-white uppercase tracking-widest transition-colors">Edit</Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
