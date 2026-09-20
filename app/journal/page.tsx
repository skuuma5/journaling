"use client"

import { useState, useEffect } from "react"
import { format, addDays, subDays, startOfDay } from "date-fns"
import Link from "next/link"
import {
  Calendar,
  Save,
  BrainCircuit,
  Lightbulb,
  Target,
  AlertCircle,
  Plus,
  Loader2,
  Newspaper,
  LineChart,
  TrendingUp,
  History,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

export default function JournalPage() {
  const [date, setDate] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [trades, setTrades] = useState<any[]>([])

  const [formData, setFormData] = useState({
    marketBias: "",
    importantNews: "",
    plan: "",
    levels: "",
    scenarios: "",
    lessons: "",
    mistakes: "",
    tomorrowPlan: "",
    mood: "Calm / Neutral",
    rating: 5
  })

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Fetch entry for the specific date
        const [entryRes, tradesRes] = await Promise.all([
          fetch(`/api/journal?date=${date.toISOString()}`),
          fetch(`/api/trades`)
        ])

        const entry = await entryRes.json()
        const allTrades = await tradesRes.json()

        // Filter trades for the selected day locally
        const dayTrades = allTrades.filter((t: any) =>
          format(new Date(t.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        )
        setTrades(dayTrades)

        if (entry && entry.id) {
          setFormData({
            marketBias: entry.marketBias || "",
            importantNews: entry.importantNews || "",
            plan: entry.plan || "",
            levels: entry.levels || "",
            scenarios: entry.scenarios || "",
            lessons: entry.lessons || "",
            mistakes: entry.mistakes || "",
            tomorrowPlan: entry.tomorrowPlan || "",
            mood: entry.mood || "Calm / Neutral",
            rating: entry.rating || 5
          })
        } else {
          // Reset form for new days
          setFormData({
            marketBias: "",
            importantNews: "",
            plan: "",
            levels: "",
            scenarios: "",
            lessons: "",
            mistakes: "",
            tomorrowPlan: "",
            mood: "Calm / Neutral",
            rating: 5
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [date])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, date: date.toISOString() })
      })
      if (res.ok) {
        // Show success state if needed
      }
    } catch (e) {
      alert("Failed to save entry")
    } finally {
      setSaving(false)
    }
  }

  const dailyPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Daily Performance Journal</h2>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Capture market context and execution reviews.</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
           {/* Date Navigation */}
           <div className="flex items-center bg-card border border-border rounded-md overflow-hidden">
              <button
                onClick={() => setDate(prev => subDays(prev, 1))}
                className="p-2 hover:bg-neutral-800 border-r border-border transition-colors"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="px-4 py-2 flex items-center gap-3 relative group">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-widest">{format(date, 'MMM dd, yyyy')}</span>
                <input
                  type="date"
                  value={format(date, 'yyyy-MM-dd')}
                  onChange={(e) => setDate(new Date(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <button
                onClick={() => setDate(prev => addDays(prev, 1))}
                className="p-2 hover:bg-neutral-800 border-l border-border transition-colors"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
           </div>

           <button
             onClick={handleSave}
             disabled={saving}
             className="flex-1 md:flex-none bg-white text-black px-6 py-2 rounded-md text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-50"
           >
             {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
             {saving ? 'Saving...' : 'Save Daily Log'}
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.3em]">Accessing Terminal Logs...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Journal Content */}
          <div className="lg:col-span-8 space-y-8">

            {/* Market Context Section */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-neutral-900/50 border-b border-border flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-blue-500" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Market Context & Fundamentals</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Market Bias</label>
                  <textarea
                    value={formData.marketBias}
                    onChange={(e) => setFormData({...formData, marketBias: e.target.value})}
                    placeholder="Bullish/Bearish narrative, HTF structure..."
                    className="w-full bg-neutral-900/50 border border-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-white/20 outline-none min-h-[100px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Important News</label>
                  <textarea
                    value={formData.importantNews}
                    onChange={(e) => setFormData({...formData, importantNews: e.target.value})}
                    placeholder="CPI, FOMC, NFP, Red Folder events..."
                    className="w-full bg-neutral-900/50 border border-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-white/20 outline-none min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Execution Plan Section */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-neutral-900/50 border-b border-border flex items-center gap-2">
                <LineChart className="w-4 h-4 text-success" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Execution & Setup Analysis</h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Key Levels</label>
                    <textarea
                      value={formData.levels}
                      onChange={(e) => setFormData({...formData, levels: e.target.value})}
                      placeholder="Daily PDH/PDL, Liquidity pools, Order blocks..."
                      className="w-full bg-neutral-900/50 border border-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-white/20 outline-none min-h-[80px] resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Expected Scenarios</label>
                    <textarea
                      value={formData.scenarios}
                      onChange={(e) => setFormData({...formData, scenarios: e.target.value})}
                      placeholder="Scenario A (Sweep & Reverse), Scenario B (Break & Retest)..."
                      className="w-full bg-neutral-900/50 border border-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-white/20 outline-none min-h-[80px] resize-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Execution Plan</label>
                  <textarea
                    value={formData.plan}
                    onChange={(e) => setFormData({...formData, plan: e.target.value})}
                    placeholder="How will I enter? What confirms the setup?"
                    className="w-full bg-neutral-900/50 border border-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-white/20 outline-none min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Review Section */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-neutral-900/50 border-b border-border flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-500" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Post-Session Review</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">What I Learned</label>
                  <textarea
                    value={formData.lessons}
                    onChange={(e) => setFormData({...formData, lessons: e.target.value})}
                    placeholder="Key takeaways from today's price action..."
                    className="w-full bg-neutral-900/50 border border-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-white/20 outline-none min-h-[120px] resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tomorrow's Plan</label>
                  <textarea
                    value={formData.tomorrowPlan}
                    onChange={(e) => setFormData({...formData, tomorrowPlan: e.target.value})}
                    placeholder="Adjustments for next session..."
                    className="w-full bg-neutral-900/50 border border-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-white/20 outline-none min-h-[120px] resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Trades, Psychology, Stats */}
          <div className="lg:col-span-4 space-y-8">

            {/* Trades Taken Today */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
              <div className="p-4 bg-neutral-900/50 border-b border-border flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-purple-500" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Trades for this day</h3>
                </div>
                <span className={cn(
                  "text-[10px] font-black",
                  dailyPnl >= 0 ? "text-success" : "text-danger"
                )}>
                  {dailyPnl >= 0 ? "+" : ""}{formatCurrency(dailyPnl)}
                </span>
              </div>
              <div className="divide-y divide-border">
                {trades.length === 0 ? (
                  <div className="p-8 text-center text-[9px] font-black text-muted-foreground uppercase tracking-widest italic opacity-50">
                    No trades found for this date.
                  </div>
                ) : (
                  trades.map(trade => (
                    <Link href={`/trades/${trade.id}`} key={trade.id} className="p-3 flex items-center justify-between hover:bg-neutral-900/30 transition-colors block">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded flex items-center justify-center text-[8px] font-black border",
                          trade.direction === "BUY" ? "bg-success/5 border-success/20 text-success" : "bg-danger/5 border-danger/20 text-danger"
                        )}>
                          {trade.direction}
                        </div>
                        <div>
                          <p className="text-xs font-black text-white">{trade.symbol}</p>
                          <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest">{trade.account.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {trade.pnl >= 0 ? <ArrowUpRight className="w-2.5 h-2.5 text-success" /> : <ArrowDownRight className="w-2.5 h-2.5 text-danger" />}
                          <p className={cn("text-xs font-black", trade.pnl >= 0 ? "text-success" : "text-danger")}>
                            {formatCurrency(trade.pnl)}
                          </p>
                        </div>
                        <span className="text-[8px] font-bold text-muted-foreground">{format(new Date(trade.date), 'HH:mm')}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>

            {/* Psychology Card */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
                <BrainCircuit className="w-4 h-4" /> Psychological State
              </h3>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Mood / Mindset</label>
                  <select
                    value={formData.mood}
                    onChange={(e) => setFormData({...formData, mood: e.target.value})}
                    className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                  >
                    <option>Calm / Neutral</option>
                    <option>Confident / Flow</option>
                    <option>Anxious / Fearful</option>
                    <option>Greedy / Impatient</option>
                    <option>Revenge / Tilted</option>
                    <option>Tired / Distracted</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Focus Level</label>
                    <span className="text-[10px] font-black text-white">{formData.rating}/10</span>
                  </div>
                  <input
                    type="range" min="1" max="10"
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value)})}
                    className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>
            </div>

            {/* Mistakes Card */}
            <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-danger flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Behavioral Leaks
              </h3>
              <div className="space-y-3">
                <textarea
                  value={formData.mistakes}
                  onChange={(e) => setFormData({...formData, mistakes: e.target.value})}
                  placeholder="Identify FOMO, revenge trading, or rule breaches..."
                  className="w-full bg-neutral-900/50 border border-border rounded-lg p-3 text-[11px] focus:ring-1 focus:ring-white/20 outline-none min-h-[100px] resize-none text-white"
                />
              </div>
            </div>

            <div className="bg-neutral-900/30 border border-border rounded-xl p-6">
              <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500 mb-4">Day Summary</h4>
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Volume</span>
                    <span className="text-xs font-bold text-white">{trades.length} Executions</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Net Result</span>
                    <span className={cn("text-xs font-bold", dailyPnl >= 0 ? "text-success" : "text-danger")}>
                      {dailyPnl >= 0 ? "+" : ""}{formatCurrency(dailyPnl)}
                    </span>
                 </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
