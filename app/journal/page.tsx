"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { format, addDays, subDays, parseISO } from "date-fns"
import Link from "next/link"
import {
  Calendar,
  Save,
  BrainCircuit,
  Lightbulb,
  AlertCircle,
  Loader2,
  Newspaper,
  LineChart,
  History,
  ChevronLeft,
  ChevronRight,
  CheckCircle2
} from "lucide-react"
import { cn, formatCurrency } from "@/lib/utils"

export default function JournalPage() {
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
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

  const isDirty = useRef(false)
  const dateStr = format(date, 'yyyy-MM-dd')

  const fetchData = useCallback(async (targetDate: Date) => {
    const currentDay = format(targetDate, 'yyyy-MM-dd')
    setLoading(true)

    try {
      const [entryRes, tradesRes] = await Promise.all([
        fetch(`/api/journal?date=${currentDay}`),
        fetch(`/api/trades`)
      ])

      const entry = await entryRes.json()
      const allTrades = await tradesRes.json()

      const dayTrades = Array.isArray(allTrades) ? allTrades.filter((t: any) =>
        format(new Date(t.date), 'yyyy-MM-dd') === currentDay
      ) : []

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
        setFormData({
          marketBias: "", importantNews: "", plan: "", levels: "",
          scenarios: "", lessons: "", mistakes: "", tomorrowPlan: "",
          mood: "Calm / Neutral", rating: 5
        })
      }
      isDirty.current = false
    } catch (e) {
      console.error("Fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(date)
  }, [date, fetchData])

  const handleSave = async () => {
    setSaving(true)
    setSaveSuccess(false)
    try {
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, date: dateStr })
      })
      if (res.ok) {
        setSaveSuccess(true)
        isDirty.current = false
        setTimeout(() => setSaveSuccess(false), 3000)
      }
    } catch (e) {
      alert("Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    isDirty.current = true
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const dailyPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0)

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Terminal Journal</h2>
          <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest opacity-60">Log session data & context.</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="flex items-center bg-card border border-border rounded-md overflow-hidden shadow-xl">
            <button
              onClick={() => { if(!isDirty.current || confirm("Discard unsaved changes?")) setDate(prev => subDays(prev, 1)) }}
              className="p-2.5 hover:bg-neutral-800 border-r border-border transition-colors text-muted-foreground hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-4 py-2 flex items-center gap-3 relative min-w-[160px] justify-center">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-black uppercase tracking-widest">{format(date, 'MMM dd, yyyy')}</span>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => {
                  if (e.target.value) {
                    isDirty.current = false
                    const newDate = parseISO(e.target.value);
                    newDate.setHours(0, 0, 0, 0);
                    setDate(newDate);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
            <button
              onClick={() => { if(!isDirty.current || confirm("Discard unsaved changes?")) setDate(prev => addDays(prev, 1)) }}
              className="p-2.5 hover:bg-neutral-800 border-l border-border transition-colors text-muted-foreground hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={cn(
              "px-8 py-2.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95 shadow-xl disabled:opacity-50",
              saveSuccess ? "bg-success text-white" : "bg-white text-black hover:bg-neutral-200"
            )}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saveSuccess ? 'Data Secured' : 'Sync Log'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
        {loading && (
          <div className="absolute inset-0 z-10 bg-background/40 backdrop-blur-[2px] flex items-center justify-center rounded-xl">
             <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-white animate-spin opacity-50" />
                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/50">Syncing...</span>
             </div>
          </div>
        )}

        <div className="lg:col-span-8 space-y-8">
          <div className="bg-card border border-border rounded-xl p-6 shadow-2xl space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-blue-500">
              <Newspaper className="w-4 h-4" /> Market Context
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Market Bias</label>
                <textarea
                  value={formData.marketBias}
                  onChange={(e) => handleInputChange('marketBias', e.target.value)}
                  placeholder="HTF narrative..."
                  className="w-full bg-neutral-900 border border-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-white/10 min-h-[100px] resize-none text-white font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Macro Events</label>
                <textarea
                  value={formData.importantNews}
                  onChange={(e) => handleInputChange('importantNews', e.target.value)}
                  placeholder="News, Red folders..."
                  className="w-full bg-neutral-900 border border-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-white/10 min-h-[100px] resize-none text-white font-medium"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-success">
              <LineChart className="w-4 h-4" /> Execution Logic
            </h3>
            <textarea
              value={formData.plan}
              onChange={(e) => handleInputChange('plan', e.target.value)}
              placeholder="Entry triggers & strategy notes..."
              className="w-full bg-neutral-900 border border-border rounded-lg p-4 text-sm focus:ring-1 focus:ring-white/10 min-h-[150px] resize-none text-white font-medium"
            />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-yellow-500">
              <Lightbulb className="w-4 h-4" /> Performance Audit
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Key Lessons</label>
                 <textarea
                    value={formData.lessons}
                    onChange={(e) => handleInputChange('lessons', e.target.value)}
                    placeholder="Takeaways..."
                    className="w-full bg-neutral-900 border border-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-white/10 min-h-[120px] resize-none text-white font-medium"
                  />
               </div>
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Tomorrow's Focus</label>
                 <textarea
                    value={formData.tomorrowPlan}
                    onChange={(e) => handleInputChange('tomorrowPlan', e.target.value)}
                    placeholder="Adjustments..."
                    className="w-full bg-neutral-900 border border-border rounded-lg p-3 text-sm focus:ring-1 focus:ring-white/10 min-h-[120px] resize-none text-white font-medium"
                  />
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 bg-neutral-900/50 border-b border-border flex justify-between items-center">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-purple-500" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Executions</h3>
              </div>
              <span className={cn("text-[11px] font-black tabular-nums", dailyPnl >= 0 ? "text-success" : "text-danger")}>
                {formatCurrency(dailyPnl)}
              </span>
            </div>
            <div className="divide-y divide-border max-h-[300px] overflow-y-auto custom-scrollbar">
              {trades.length === 0 ? (
                <div className="p-12 text-center text-[9px] font-black text-muted-foreground uppercase opacity-30 italic">No activity logs.</div>
              ) : (
                trades.map(trade => (
                  <Link href={`/trades/${trade.id}`} key={trade.id} className="p-4 flex items-center justify-between hover:bg-neutral-900/50 transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-9 h-9 rounded flex items-center justify-center text-[9px] font-black border",
                        trade.direction === "BUY" ? "bg-success/5 border-success/20 text-success" : "bg-danger/5 border-danger/20 text-danger"
                      )}>{trade.direction}</div>
                      <div>
                        <p className="text-xs font-black text-white group-hover:text-primary transition-colors">{trade.symbol}</p>
                        <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-widest truncate max-w-[80px]">{trade.account.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-xs font-black tabular-nums", trade.pnl >= 0 ? "text-success" : "text-danger")}>
                        {formatCurrency(trade.pnl)}
                      </p>
                      <span className="text-[9px] font-bold text-neutral-500">{format(new Date(trade.date), 'HH:mm')}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-2xl space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
              <BrainCircuit className="w-4 h-4" /> Psychology Audit
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Current Mood</label>
                <select
                  value={formData.mood}
                  onChange={(e) => handleInputChange('mood', e.target.value)}
                  className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2.5 text-xs font-bold outline-none cursor-pointer text-white"
                >
                  <option>Calm / Neutral</option>
                  <option>Confident / Flow</option>
                  <option>Anxious / Fearful</option>
                  <option>Greedy / Impatient</option>
                  <option>Revenge / Tilted</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Focus Level</label>
                  <span className="text-xs font-black text-white font-mono">{formData.rating}/10</span>
                </div>
                <input
                  type="range" min="1" max="10"
                  value={formData.rating}
                  onChange={(e) => handleInputChange('rating', parseInt(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-2xl space-y-4 border-l-4 border-l-danger">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-danger flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Behavioral Leaks
            </h3>
            <textarea
              value={formData.mistakes}
              onChange={(e) => handleInputChange('mistakes', e.target.value)}
              placeholder="List specific rule breaches (e.g. FOMO, Moved SL)..."
              className="w-full bg-neutral-900 border border-border rounded-lg p-3 text-[11px] focus:ring-1 focus:ring-white/20 outline-none min-h-[100px] resize-none text-white font-medium"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
