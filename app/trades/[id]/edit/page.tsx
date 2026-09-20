"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Tag as TagIcon, AlertCircle, ImageIcon, Plus, X } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import AudioRecorder from "@/components/AudioRecorder"

export default function EditTradePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [strategies, setStrategies] = useState<any[]>([])
  const [audioId, setAudioId] = useState<string | null>(null)

  const [formData, setFormData] = useState<any>({
    symbol: "",
    direction: "BUY",
    entryPrice: "",
    exitPrice: "",
    stopLoss: "",
    takeProfit: "",
    lotSize: "",
    date: "",
    time: "",
    session: "NY",
    strategyId: "",
    notes: "",
    preTradePlan: "",
    postTradeReview: "",
    emotion: "Calm",
    result: "WIN",
    pnl: "",
    actualR: ""
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [tradeRes, stratRes] = await Promise.all([
          fetch(`/api/trades/${params.id}`),
          fetch('/api/strategies')
        ])
        const trade = await tradeRes.json()
        const strats = await stratRes.json()

        setStrategies(strats)
        const tradeDate = new Date(trade.date)

        setFormData({
          ...trade,
          entryPrice: trade.entryPrice.toString(),
          exitPrice: trade.exitPrice?.toString() || "",
          stopLoss: trade.stopLoss?.toString() || "",
          takeProfit: trade.takeProfit?.toString() || "",
          lotSize: trade.lotSize.toString(),
          pnl: trade.pnl?.toString() || "",
          actualR: trade.actualR?.toString() || "",
          date: tradeDate.toISOString().split('T')[0],
          time: tradeDate.toTimeString().split(' ')[0].slice(0, 5),
        })
        setAudioId(trade.audioId)
      } catch (error) {
        console.error(error)
      } finally {
        setFetching(false)
      }
    }
    fetchData()
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/trades/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          entryPrice: parseFloat(formData.entryPrice) || 0,
          exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
          stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
          takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : null,
          lotSize: parseFloat(formData.lotSize) || 0,
          pnl: formData.pnl ? parseFloat(formData.pnl) : null,
          actualR: formData.actualR ? parseFloat(formData.actualR) : null,
          audioId: audioId
        }),
      })

      if (res.ok) {
        router.push(`/trades/${params.id}`)
        router.refresh()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <Loader2 className="w-8 h-8 text-white animate-spin" />
      <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Loading trade data...</p>
    </div>
  )

  const pnlValue = parseFloat(formData.pnl)
  const isNegative = pnlValue < 0 || formData.result === "LOSS"
  const isPositive = pnlValue > 0 || formData.result === "WIN"

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href={`/trades/${params.id}`} className="p-2 hover:bg-neutral-900 rounded-full transition-colors text-white border border-transparent hover:border-border">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Edit Execution</h2>
            <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Refine terminal data records.</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-md text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4" />}
          Update Trade
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-2xl">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] border-b border-border pb-4 text-neutral-400">Trade Execution</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Symbol</label>
                <input type="text" name="symbol" value={formData.symbol} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/20 font-bold uppercase text-white" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setFormData((prev: any) => ({ ...prev, direction: "BUY" }))} className={cn("py-2 text-[10px] font-black rounded border transition-all uppercase tracking-widest", formData.direction === "BUY" ? "bg-success/20 border-success text-success" : "bg-neutral-900 border-border text-neutral-500")}>BUY</button>
                  <button type="button" onClick={() => setFormData((prev: any) => ({ ...prev, direction: "SELL" }))} className={cn("py-2 text-[10px] font-black rounded border transition-all uppercase tracking-widest", formData.direction === "SELL" ? "bg-danger/20 border-danger text-danger" : "bg-neutral-900 border-border text-neutral-500")}>SELL</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Result</label>
                <div className="grid grid-cols-3 gap-1">
                  <button type="button" onClick={() => setFormData((prev: any) => ({ ...prev, result: "WIN" }))} className={cn("py-2 text-[9px] font-black rounded border transition-all uppercase", formData.result === "WIN" ? "bg-success border-success text-white" : "bg-neutral-900 border-border text-neutral-500")}>WIN</button>
                  <button type="button" onClick={() => setFormData((prev: any) => ({ ...prev, result: "LOSS" }))} className={cn("py-2 text-[9px] font-black rounded border transition-all uppercase", formData.result === "LOSS" ? "bg-danger border-danger text-white" : "bg-neutral-900 border-border text-neutral-500")}>LOSS</button>
                  <button type="button" onClick={() => setFormData((prev: any) => ({ ...prev, result: "BREAKEVEN" }))} className={cn("py-2 text-[9px] font-black rounded border transition-all uppercase", formData.result === "BREAKEVEN" ? "bg-neutral-700 border-neutral-600 text-white" : "bg-neutral-900 border-border text-neutral-500")}>BE</button>
                </div>
              </div>

              <div className="space-y-2">
                <label className={cn("text-[10px] font-black uppercase tracking-widest transition-colors", isNegative ? "text-danger" : isPositive ? "text-success" : "text-muted-foreground")}>Net P&L ($)</label>
                <input
                  type="number"
                  step="any"
                  name="pnl"
                  value={formData.pnl}
                  onChange={handleChange}
                  className={cn(
                    "w-full bg-neutral-900 border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 transition-all font-black tabular-nums",
                    isNegative ? "border-danger text-danger focus:ring-danger" :
                    isPositive ? "border-success text-success focus:ring-success" :
                    "border-border text-white focus:ring-white/20"
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-blue-400">Realized R:R</label>
                <input type="number" step="any" name="actualR" value={formData.actualR} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500 text-blue-400 font-black tabular-nums" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Lot Size</label>
                <input type="number" step="any" name="lotSize" value={formData.lotSize} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/20 text-white font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Entry Price</label>
                <input type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/20 text-white font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Exit Price</label>
                <input type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/20 text-white font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-danger/80">Stop Loss (SL)</label>
                <input type="number" step="any" name="stopLoss" value={formData.stopLoss} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-danger/50 text-white font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest text-success/80">Take Profit (TP)</label>
                <input type="number" step="any" name="takeProfit" value={formData.takeProfit} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-success/50 text-white font-bold" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-2xl">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] border-b border-border pb-4 text-neutral-400">Journal & Review</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pre-Trade Logic</label>
                <textarea name="preTradePlan" rows={3} value={formData.preTradePlan} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/20 resize-none text-white" placeholder="What was the setup?" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Post-Trade Reality</label>
                <textarea name="postTradeReview" rows={3} value={formData.postTradeReview} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/20 resize-none text-white" placeholder="What happened?" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-2xl">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] border-b border-border pb-4 flex items-center gap-2 text-neutral-400">
              <TagIcon className="w-4 h-4" /> Categorization
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Session</label>
                <select name="session" value={formData.session} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none font-bold text-white uppercase cursor-pointer">
                  <option value="ASIA">ASIA</option>
                  <option value="LONDON">LONDON</option>
                  <option value="NY">NY</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Strategy</label>
                <select name="strategyId" value={formData.strategyId || ""} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none font-bold text-white uppercase cursor-pointer">
                  <option value="">No Strategy</option>
                  {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</label>
                   <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-xs font-bold text-white" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Time</label>
                   <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-xs font-bold text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] border-b border-border pb-4 flex items-center gap-2 text-neutral-400">
              Audio Record
            </h3>
            <AudioRecorder
              initialAudioId={audioId || undefined}
              onAudioSaved={(id) => setAudioId(id)}
              onDelete={() => setAudioId(null)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
