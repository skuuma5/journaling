"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, Tag as TagIcon, AlertCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function EditTradePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [strategies, setStrategies] = useState<any[]>([])

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
          date: tradeDate.toISOString().split('T')[0],
          time: tradeDate.toTimeString().split(' ')[0].slice(0, 5),
        })
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
        body: JSON.stringify(formData),
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

  if (fetching) return <div className="flex items-center justify-center h-[50vh]">Loading trade data...</div>

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href={`/trades/${params.id}`} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Edit Trade</h2>
            <p className="text-muted-foreground font-medium">Refine your trade execution data.</p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-md text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Update Trade
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-2xl">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] border-b border-border pb-4 text-neutral-400">Trade Execution</h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Symbol</label>
                <input type="text" name="symbol" value={formData.symbol} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-white/20" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Direction</label>
                <select name="direction" value={formData.direction} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none">
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Lot Size</label>
                <input type="number" step="any" name="lotSize" value={formData.lotSize} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Entry Price</label>
                <input type="number" step="any" name="entryPrice" value={formData.entryPrice} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Exit Price</label>
                <input type="number" step="any" name="exitPrice" value={formData.exitPrice} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Result</label>
                <select name="result" value={formData.result} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none">
                  <option value="WIN">WIN</option>
                  <option value="LOSS">LOSS</option>
                  <option value="BREAKEVEN">BREAKEVEN</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-2xl">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] border-b border-border pb-4 text-neutral-400">Post-Trade Review</h3>
            <textarea name="postTradeReview" rows={6} value={formData.postTradeReview} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-white/20 resize-none" placeholder="What happened?" />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-2xl">
            <h3 className="font-black text-xs uppercase tracking-[0.3em] border-b border-border pb-4 text-neutral-400">Context</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Session</label>
                <select name="session" value={formData.session} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-xs font-bold outline-none">
                  <option value="ASIA">ASIA</option>
                  <option value="LONDON">LONDON</option>
                  <option value="NY">NY</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Strategy</label>
                <select name="strategyId" value={formData.strategyId || ""} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-xs font-bold outline-none">
                  <option value="">No Strategy</option>
                  {strategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Emotion</label>
                <select name="emotion" value={formData.emotion} onChange={handleChange} className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-xs font-bold outline-none">
                  <option>Calm</option>
                  <option>Confident</option>
                  <option>Fear</option>
                  <option>Greed</option>
                  <option>Revenge</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
