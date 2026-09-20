"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend, LabelList
} from 'recharts'
import { StatCard } from "@/components/StatCard"
import { BarChart3, TrendingUp, Calendar, Target, Activity, Loader2, Filter, Globe, AlertTriangle } from "lucide-react"
import { formatCurrency, cn } from "@/lib/utils"

const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6']

function AnalyticsUI() {
  const searchParams = useSearchParams()
  const [selectedAccountId, setSelectedAccountId] = useState(searchParams.get('accountId') || "all")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<any[]>([])

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/accounts')
        if (res.ok) {
          const json = await res.json()
          if (Array.isArray(json)) setAccounts(json)
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchAccounts()
  }, [])

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      try {
        const url = `/api/analytics?accountId=${selectedAccountId}`
        const res = await fetch(url)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (error) {
        console.error("Failed to fetch analytics", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [selectedAccountId])

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Processing Performance Data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Terminal Analytics</h2>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Deep execution audit & edge analysis.</p>
        </div>

        <div className="relative w-full md:w-64">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full bg-card border border-border rounded-md pl-9 pr-4 py-2 text-[10px] font-black text-white focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none uppercase tracking-widest cursor-pointer"
          >
            <option value="all">All Terminals</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {!data || data.isEmpty ? (
        <div className="flex flex-col items-center justify-center h-[50vh] border border-dashed border-border rounded-xl">
          <Activity className="w-12 h-12 text-muted-foreground mb-4 opacity-10" />
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">No Execution Data</h3>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-2">Log trades to generate analytics reports.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Accuracy" value={`${data.winRate.toFixed(1)}%`} subValue="Verified" trend={data.winRate >= 60 ? "up" : "neutral"} />
            <StatCard label="Total Vol" value={data.totalTrades} subValue="Executions" trend="neutral" />
            <StatCard label="Profit Factor" value={data.profitFactor?.toFixed(2) || "0.00"} subValue="Edge Index" trend={data.profitFactor >= 1.5 ? "up" : "neutral"} />
            <StatCard label="Session Edge" value={data.sessionStats.sort((a: any, b: any) => b.pnl - a.pnl)[0]?.name || "N/A"} subValue="Most Profitable" trend="up" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-2xl relative overflow-hidden">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] mb-8 flex items-center gap-2 text-neutral-400">
                <TrendingUp className="w-4 h-4 text-success" />
                Capital Appreciation
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.equityCurve}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#171717" vertical={false} />
                    <XAxis dataKey="date" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="balance" stroke="#10b981" fillOpacity={1} fill="url(#colorBalance)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Trading Sessions Chart - CLEAN DESIGN */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-2xl relative overflow-hidden">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] mb-8 flex items-center gap-2 text-neutral-400">
                <Globe className="w-4 h-4 text-blue-500" />
                Session Performance (Net P&L)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.sessionStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#171717" vertical={false} />
                    <XAxis dataKey="name" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      cursor={{fill: '#171717'}}
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value: any, name: any) => {
                        if (name === "pnl") return [formatCurrency(value), "Net P&L"]
                        return [value, "Trades Entered"]
                      }}
                    />
                    <Bar dataKey="pnl" name="pnl" radius={[4, 4, 0, 0]} barSize={50}>
                      {data.sessionStats.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="top"
                        formatter={(val: any) => `${val} Trades`}
                        style={{ fontSize: '10px', fill: '#737373', fontWeight: '900', textTransform: 'uppercase' }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-2xl relative overflow-hidden">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] mb-8 flex items-center gap-2 text-neutral-400">
                <Calendar className="w-4 h-4 text-primary" />
                Weekly Performance Breakdown
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.pnlByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#171717" vertical={false} />
                    <XAxis dataKey="day" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '8px', fontSize: '12px' }}
                    />
                    <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                      {data.pnlByDay.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-2xl relative overflow-hidden">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] mb-8 flex items-center gap-2 text-neutral-400">
                <Activity className="w-4 h-4 text-purple-500" />
                Execution Probability
              </h3>
              <div className="h-[300px] flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Wins', value: data.winRate },
                        { name: 'Losses', value: 100 - data.winRate }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="#10b981" />
                      <Cell fill="#ef4444" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-black text-white">{data.winRate.toFixed(1)}%</span>
                  <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Accuracy</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-xl p-6 shadow-2xl relative overflow-hidden">
              <h3 className="font-black text-xs uppercase tracking-[0.3em] mb-8 flex items-center gap-2 text-neutral-400">
                <Target className="w-4 h-4 text-yellow-500" />
                Model Efficiency (by Strategy)
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byStrategy} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#171717" horizontal={false} />
                    <XAxis type="number" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} width={100} />
                    <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '8px' }} />
                    <Bar dataKey="pnl" radius={[0, 2, 2, 0]}>
                      {data.byStrategy.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-border bg-neutral-900/20 flex items-center justify-between">
                <h3 className="font-black text-xs uppercase tracking-[0.3em] flex items-center gap-2 text-danger">
                  <AlertTriangle className="w-4 h-4" />
                  Process Leaks (Behavioral Audit)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 border-b border-border bg-neutral-900/30">
                      <th className="px-6 py-4 font-black">Process Error</th>
                      <th className="px-6 py-4 font-black text-center">Executions</th>
                      <th className="px-6 py-4 text-right font-black">Capital Lost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.byMistake && data.byMistake.length > 0 ? (
                      data.byMistake.map((m: any) => (
                        <tr key={m.name} className="group hover:bg-danger/5 transition-all border-l-2 border-transparent hover:border-danger">
                          <td className="px-6 py-5">
                            <span className="font-black text-white text-sm uppercase tracking-tight">{m.name}</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="text-[10px] font-black bg-neutral-800 px-2 py-1 rounded text-neutral-400 uppercase">{m.count} Times</span>
                          </td>
                          <td className="px-6 py-5 text-right font-black text-danger text-sm tabular-nums">
                            -{formatCurrency(Math.abs(m.loss))}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-20 text-center text-xs text-neutral-600 italic uppercase tracking-widest font-black opacity-40">
                          Zero process breaches detected. Terminal integrity optimal.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function AnalyticsClient() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Syncing Analytics Terminal...</p>
      </div>
    }>
      <AnalyticsUI />
    </Suspense>
  )
}
