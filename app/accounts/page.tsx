import { PlusCircle, CreditCard, Target, AlertTriangle, TrendingUp, History } from "lucide-react"
import prisma from "@/lib/prisma"
import { formatCurrency, cn } from "@/lib/utils"
import Link from "next/link"

async function getAccounts() {
  return await prisma.account.findMany({
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white">Accounts</h2>
          <p className="text-muted-foreground">Manage your trading accounts and prop firm challenges.</p>
        </div>
        <Link
          href="/accounts/new"
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md text-sm font-semibold hover:bg-neutral-200 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Create Account
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {accounts.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-card/50">
             <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
             <h3 className="text-xl font-semibold">No accounts found</h3>
             <p className="text-muted-foreground mb-6">Create your first account to start journaling.</p>
             <Link
                href="/accounts/new"
                className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium"
              >
                Add My First Account
              </Link>
          </div>
        ) : (
          accounts.map((account) => {
            const pnl = account.currentBalance - account.initialBalance
            const pnlPercent = (pnl / account.initialBalance) * 100
            const progress = account.profitTarget ? (pnl / account.profitTarget) * 100 : 0

            return (
              <div key={account.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-neutral-700 transition-all group">
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          account.status === "HEALTHY" ? "bg-success" :
                          account.status === "WARNING" ? "bg-yellow-500" : "bg-danger"
                        )} />
                        <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">{account.accountType}</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">{account.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground uppercase mb-1">Balance</p>
                      <p className="text-2xl font-black">{formatCurrency(account.currentBalance, account.currency)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-900/50 p-3 rounded-lg border border-border/50">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Total P&L</p>
                      <p className={cn("text-lg font-bold", pnl >= 0 ? "text-success" : "text-danger")}>
                        {pnl >= 0 ? "+" : ""}{formatCurrency(pnl, account.currency)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{pnlPercent.toFixed(2)}%</p>
                    </div>
                    <div className="bg-neutral-900/50 p-3 rounded-lg border border-border/50">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Trades</p>
                      <p className="text-lg font-bold text-white">{account._count.trades}</p>
                      <p className="text-[10px] text-muted-foreground">Lifetime</p>
                    </div>
                  </div>

                  {account.profitTarget && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Target className="w-3 h-3" /> Profit Target
                        </span>
                        <span className="text-white">{formatCurrency(account.profitTarget, account.currency)}</span>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-full h-2 overflow-hidden border border-border">
                        <div
                          className={cn("h-full transition-all", pnl >= 0 ? "bg-success" : "bg-neutral-700")}
                          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                        <span>{Math.max(0, progress).toFixed(1)}% Completed</span>
                        <span>{formatCurrency(Math.max(0, account.profitTarget - pnl), account.currency)} Remaining</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-2">
                     <div className="flex-1 space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-danger" /> Max DD
                        </p>
                        <p className="text-xs font-medium">{account.maxDrawdown ? formatCurrency(account.maxDrawdown, account.currency) : "N/A"}</p>
                     </div>
                     <div className="flex-1 space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-yellow-500" /> Daily Loss
                        </p>
                        <p className="text-xs font-medium">{account.dailyLossLimit ? formatCurrency(account.dailyLossLimit, account.currency) : "N/A"}</p>
                     </div>
                  </div>
                </div>

                <div className="border-t border-border p-3 bg-neutral-900/20 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/accounts/${account.id}`} className="text-xs font-bold text-muted-foreground hover:text-white flex items-center gap-1">
                    <History className="w-3 h-3" /> View History
                  </Link>
                  <div className="flex gap-3">
                     <Link href={`/accounts/${account.id}/edit`} className="text-xs font-bold text-muted-foreground hover:text-white">Edit</Link>
                     <button className="text-xs font-bold text-danger/70 hover:text-danger">Archive</button>
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
