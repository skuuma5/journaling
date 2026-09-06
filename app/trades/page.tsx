"use client"

import { useState, useEffect } from "react"
import { formatCurrency, cn } from "@/lib/utils"
import { format } from "date-fns"
import { Search, ArrowUpDown, ChevronRight, Loader2, Filter } from "lucide-react"
import Link from "next/link"

export default function TradesPage() {
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' })
  const [filterResult, setFilterResult] = useState<string>("ALL")

  useEffect(() => {
    async function fetchTrades() {
      try {
        const res = await fetch('/api/trades')
        const data = await res.json()
        if (Array.isArray(data)) {
          setTrades(data)
        }
      } catch (e) {
        console.error("Failed to fetch trades:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchTrades()
  }, [])

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  // منطق الفلترة والبحث
  const processedTrades = [...trades]
    .filter(trade => {
      const searchStr = search.toLowerCase().trim()
      const symbolMatch = (trade.symbol || "").toLowerCase().includes(searchStr)
      const accountMatch = (trade.account?.name || "").toLowerCase().includes(searchStr)

      const matchesSearch = !searchStr || symbolMatch || accountMatch
      const matchesFilter = filterResult === "ALL" || trade.result === filterResult

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      let aVal: any = a[sortConfig.key]
      let bVal: any = b[sortConfig.key]

      if (sortConfig.key === 'account') {
        aVal = a.account?.name || ""
        bVal = b.account?.name || ""
      }

      if (sortConfig.key === 'date') {
        aVal = new Date(a.date).getTime()
        bVal = new Date(b.date).getTime()
      }

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Execution Log</h2>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Historical terminal data.</p>
        </div>
        <Link href="/trades/new" className="bg-white text-black px-6 py-2.5 rounded-md text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95 shadow-xl">
          Add Trade
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-neutral-900/50 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search symbol or account..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-neutral-950 border border-border rounded-md pl-10 pr-4 py-2 text-xs font-bold text-white outline-none focus:ring-1 focus:ring-white/20 uppercase tracking-widest transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Filter Toggle */}
            <div className="flex bg-neutral-950 p-1 rounded-md border border-border">
              {["ALL", "WIN", "LOSS"].map((res) => (
                <button
                  key={res}
                  onClick={() => setFilterResult(res)}
                  className={cn(
                    "px-4 py-1 text-[9px] font-black uppercase tracking-widest rounded transition-all",
                    filterResult === res ? "bg-white text-black shadow-lg" : "text-neutral-500 hover:text-white"
                  )}
                >
                  {res}
                </button>
              ))}
            </div>

            <div className="h-8 w-px bg-border mx-2 hidden md:block" />

            <button
                onClick={() => handleSort('pnl')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 bg-neutral-950 border border-border rounded-md text-[10px] font-black uppercase tracking-widest transition-colors group",
                  sortConfig.key === 'pnl' ? "text-white border-white/20" : "text-neutral-400 hover:text-white"
                )}
            >
              <ArrowUpDown className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Sort P&L
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-neutral-900/30 text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500">
                <th className="px-6 py-5 cursor-pointer hover:text-white" onClick={() => handleSort('date')}>Date</th>
                <th className="px-6 py-5 cursor-pointer hover:text-white" onClick={() => handleSort('symbol')}>Symbol</th>
                <th className="px-6 py-5">Dir</th>
                <th className="px-6 py-5 cursor-pointer hover:text-white" onClick={() => handleSort('account')}>Account</th>
                <th className="px-6 py-4 text-right">Entry</th>
                <th className="px-6 py-4 text-right">Exit</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('pnl')}>P&L</th>
                <th className="px-6 py-4 text-right cursor-pointer hover:text-white" onClick={() => handleSort('actualR')}>R</th>
                <th className="px-6 py-4 text-center">Result</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={10} className="px-6 py-20 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-neutral-500 opacity-20" /></td></tr>
              ) : processedTrades.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-20 text-center text-neutral-500 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">Zero records found.</td></tr>
              ) : (
                processedTrades.map((trade) => (
                  <tr key={trade.id} className="hover:bg-neutral-900/50 transition-all group border-l-2 border-transparent hover:border-white">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-[11px] font-black text-white uppercase tracking-tight">{format(new Date(trade.date), 'MMM d, yyyy')}</div>
                      <div className="text-[9px] text-neutral-500 font-bold uppercase">{format(new Date(trade.date), 'HH:mm')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-black text-white uppercase tracking-tighter">{trade.symbol}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn("text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase", trade.direction === "BUY" ? "bg-success/5 text-success border border-success/20" : "bg-danger/5 text-danger border border-danger/20")}>{trade.direction}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[9px] font-black text-neutral-400 uppercase tracking-widest">{trade.account?.name}</td>
                    <td className="px-6 py-4 text-right text-[11px] font-bold text-neutral-300 tabular-nums">{trade.entryPrice.toFixed(5)}</td>
                    <td className="px-6 py-4 text-right text-[11px] font-bold text-neutral-300 tabular-nums">{trade.exitPrice?.toFixed(5) || "—"}</td>
                    <td className={cn("px-6 py-4 text-right text-xs font-black tabular-nums tracking-tighter", (trade.pnl || 0) >= 0 ? "text-success" : "text-danger")}>
                      {(trade.pnl || 0) >= 0 ? "+" : ""}{formatCurrency(trade.pnl || 0, trade.account?.currency || "USD")}
                    </td>
                    <td className={cn("px-6 py-4 text-right text-xs font-black tabular-nums tracking-tighter", (trade.actualR || 0) > 0 ? "text-success" : (trade.actualR || 0) < 0 ? "text-danger" : "text-neutral-500")}>
                      {(trade.actualR || 0).toFixed(2)}R
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest",
                        (trade.pnl || 0) >= 0 ? "bg-success text-white shadow-[0_0_10px_rgba(16,185,129,0.2)]" : "bg-danger text-white shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                      )}>
                        {(trade.pnl || 0) >= 0 ? "WIN" : "LOSS"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/trades/${trade.id}`} className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white transition-colors border border-transparent hover:border-border"><ChevronRight className="w-4 h-4" /></Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
