"use client"

import { useState, useEffect } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths, isSameDay } from "date-fns"
import { ChevronLeft, ChevronRight, Activity, Calendar as CalendarIcon, Filter, Loader2, ArrowUpRight, ArrowDownRight, History } from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"
import Link from "next/link"

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [trades, setTrades] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [tradesRes, accountsRes] = await Promise.all([
          fetch('/api/trades'),
          fetch('/api/accounts')
        ])

        if (tradesRes.ok) {
          const tradesData = await tradesRes.json()
          setTrades(tradesData)
        }

        if (accountsRes.ok) {
          const accountsData = await accountsRes.json()
          setAccounts(accountsData)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(monthStart)
  const calendarDays = eachDayOfInterval({
    start: monthStart,
    end: monthEnd,
  })

  // Filter trades by selected account
  const filteredTrades = selectedAccountId === "all"
    ? trades
    : trades.filter(t => t.accountId === selectedAccountId)

  // Group trades by date
  const tradesByDate = filteredTrades.reduce((acc: any, trade: any) => {
    const dateKey = format(new Date(trade.date), 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(trade)
    return acc
  }, {})

  // Calculate monthly stats
  const currentMonthTrades = filteredTrades.filter(t => isSameMonth(new Date(t.date), currentDate))
  const monthlyPnl = currentMonthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)

  const greenDaysCount = Object.keys(tradesByDate).filter(dateKey => {
    const dayDate = new Date(dateKey)
    if (!isSameMonth(dayDate, currentDate)) return false
    const dayPnl = tradesByDate[dateKey].reduce((sum: number, t: any) => sum + (t.pnl || 0), 0)
    return dayPnl > 0
  }).length

  const redDaysCount = Object.keys(tradesByDate).filter(dateKey => {
    const dayDate = new Date(dateKey)
    if (!isSameMonth(dayDate, currentDate)) return false
    const dayPnl = tradesByDate[dateKey].reduce((sum: number, t: any) => sum + (t.pnl || 0), 0)
    return dayPnl < 0
  }).length

  const winRate = currentMonthTrades.length > 0
    ? (currentMonthTrades.filter(t => t.result === 'WIN').length / currentMonthTrades.length) * 100
    : 0

  const selectedDateTrades = selectedDate
    ? filteredTrades.filter(t => isSameDay(new Date(t.date), selectedDate))
    : []

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Trading Calendar</h2>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">
            {selectedAccountId === "all" ? "AGGREGATED TERMINAL VIEW" : `TERMINAL: ${accounts.find(a => a.id === selectedAccountId)?.name.toUpperCase()}`}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full md:w-56 bg-card border border-border rounded-md pl-9 pr-4 py-2 text-[10px] font-black text-white focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none uppercase tracking-widest"
            >
              <option value="all">ALL TERMINALS</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 shadow-lg">
            <button onClick={prevMonth} className="p-2 hover:bg-neutral-800 rounded-md transition-colors text-white">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-[10px] font-black min-w-[120px] text-center uppercase tracking-widest text-white">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <button onClick={nextMonth} className="p-2 hover:bg-neutral-800 rounded-md transition-colors text-white">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
        <div className="grid grid-cols-7 border-b border-border bg-neutral-900/50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-4 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square border-b border-r border-border bg-neutral-900/10 opacity-30" />
          ))}

          {calendarDays.map((day) => {
            const dateKey = format(day, 'yyyy-MM-dd')
            const dayTrades = tradesByDate[dateKey] || []
            const dailyPnl = dayTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0)
            const hasTrades = dayTrades.length > 0
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <div
                key={dateKey}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "aspect-square border-b border-r border-border p-3 flex flex-col group hover:bg-neutral-900/30 transition-all cursor-pointer relative",
                  !isSameMonth(day, monthStart) && "opacity-20",
                  isToday(day) && "bg-neutral-900/40",
                  isSelected && "bg-white/5 ring-1 ring-inset ring-white/20"
                )}
              >
                <div className="flex justify-between items-start">
                  <span className={cn(
                    "text-xs font-black w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                    isToday(day) ? "bg-white text-black" : "text-muted-foreground group-hover:text-white"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {hasTrades && (
                    <span className={cn(
                      "text-[10px] font-black tracking-tight",
                      dailyPnl >= 0 ? "text-success" : "text-danger"
                    )}>
                      {dailyPnl >= 0 ? "+" : ""}{Math.abs(dailyPnl).toFixed(0)}
                    </span>
                  )}
                </div>

                <div className="mt-auto space-y-1">
                  {dayTrades.slice(0, 3).map((trade: any) => (
                    <div key={trade.id} className="flex items-center gap-1 overflow-hidden">
                       <div className={cn(
                         "w-1 h-1 rounded-full shrink-0 shadow-[0_0_5px_rgba(0,0,0,0.5)]",
                         trade.pnl >= 0 ? "bg-success" : "bg-danger"
                       )} />
                       <span className="text-[8px] text-muted-foreground truncate uppercase font-bold tracking-tighter group-hover:text-neutral-300">
                         {trade.symbol}
                       </span>
                    </div>
                  ))}
                  {dayTrades.length > 3 && (
                    <p className="text-[8px] text-muted-foreground italic">+{dayTrades.length - 3} more</p>
                  )}
                </div>

                {hasTrades && (
                  <div className={cn(
                    "absolute inset-x-0 bottom-0 h-1 transition-all",
                    dailyPnl >= 0 ? "bg-success/30 shadow-[0_0_8px_#10b981]" : "bg-danger/30 shadow-[0_0_8px_#ef4444]"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-xl">
          <h3 className="font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2 text-neutral-400">
            <Activity className="w-4 h-4" />
            Monthly Overview
          </h3>
          <div className="space-y-4">
             <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-black uppercase tracking-widest">Monthly P&L</span>
                <span className={cn("font-black tracking-tighter text-sm", monthlyPnl >= 0 ? "text-success" : "text-danger")}>
                   {monthlyPnl >= 0 ? "+" : ""}{formatCurrency(monthlyPnl)}
                </span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-black uppercase tracking-widest">Win Rate</span>
                <span className="font-black text-white tracking-tighter text-sm">{winRate.toFixed(1)}%</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-black uppercase tracking-widest">Green Days</span>
                <span className="font-black text-success">{greenDaysCount}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-black uppercase tracking-widest">Red Days</span>
                <span className="font-black text-danger">{redDaysCount}</span>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden shadow-xl relative">
           <div className="p-6 border-b border-border bg-neutral-900/20 flex justify-between items-center relative z-10">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] text-neutral-400 flex items-center gap-2">
                <History className="w-4 h-4" />
                {selectedDate ? `Data Stream: ${format(selectedDate, 'MMMM d, yyyy').toUpperCase()}` : "Select a node to analyze"}
              </h3>
              {selectedDate && <span className="text-[10px] font-black text-white px-2 py-0.5 bg-neutral-800 rounded uppercase tracking-widest">{selectedDateTrades.length} EXECUTIONS</span>}
           </div>

           <div className="min-h-[200px] relative z-10">
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 text-white animate-spin opacity-20" />
                </div>
              ) : !selectedDate ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                   <CalendarIcon className="w-10 h-10 mb-3 opacity-10" />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Interactive Analysis Offline</p>
                   <p className="text-[11px] font-medium text-neutral-600 mt-1 italic">Click on a date cell to load execution data</p>
                </div>
              ) : selectedDateTrades.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                   No trading activity recorded on this date.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {selectedDateTrades.map((trade) => (
                    <Link href={`/trades/${trade.id}`} key={trade.id} className="flex items-center justify-between p-5 hover:bg-neutral-900/40 transition-all border-l-2 border-transparent hover:border-white group">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded flex flex-col items-center justify-center border transition-colors",
                          trade.direction === "BUY" ? "bg-success/5 border-success/20 text-success" : "bg-danger/5 border-danger/20 text-danger"
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
                          {trade.pnl! >= 0 ? <ArrowUpRight className="w-3 h-3 text-success" /> : <ArrowDownRight className="w-3 h-3 text-danger" />}
                          <p className={cn(
                            "font-black text-base tracking-tighter",
                            trade.pnl! >= 0 ? "text-success" : "text-danger"
                          )}>
                            {trade.pnl! >= 0 ? "+" : ""}{formatCurrency(trade.pnl!)}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-neutral-500 uppercase">{format(new Date(trade.date), 'HH:mm')}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
           </div>
           <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 24px' }} />
        </div>
      </div>
    </div>
  )
}
