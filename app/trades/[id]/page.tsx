"use client"

import { useState, useEffect } from "react"
import { formatCurrency, cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  Shield,
  TrendingUp,
  Activity,
  Maximize2,
  Trash2,
  Edit2,
  BrainCircuit,
  Smile,
  Hash,
  Layers,
  ImageIcon,
  X,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { notFound, useRouter } from "next/navigation"

interface TradeImage {
  id: string;
  url: string;
  type: string | null;
}

interface TagItem {
  tagId: string;
  tag: { name: string };
}

interface MistakeItem {
  id: string;
  name: string;
}

export default function TradeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [trade, setTrade] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isZoomed, setIsZoomed] = useState(false)

  useEffect(() => {
    async function fetchTrade() {
      try {
        const res = await fetch(`/api/trades/${params.id}`)
        if (res.status === 404) return notFound()
        const data = await res.json()
        setTrade(data)
      } catch (e) {
        console.error("Fetch error:", e)
      } finally {
        setLoading(false)
      }
    }
    fetchTrade()
  }, [params.id])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <Loader2 className="w-8 h-8 text-white animate-spin" />
      <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Accessing Terminal Data...</p>
    </div>
  )

  if (!trade) return notFound()

  const pnlValue = trade.pnl || 0
  const isWin = pnlValue > 0
  const isLoss = pnlValue < 0

  // إصلاح الخطأ: تأكد من أن المصفوفة موجودة قبل استخدام find
  const images: TradeImage[] = trade.images || []
  const mainImage = images.length > 0
    ? (images.find((img) => img.type === "AFTER") || images[0])
    : null

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this trade?")) return
    try {
      const res = await fetch(`/api/trades/${trade.id}`, { method: 'DELETE' })
      if (res.ok) router.push('/trades')
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {isZoomed && mainImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-md"
          onClick={() => setIsZoomed(false)}
        >
          <button className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all border border-white/10">
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={mainImage.url}
            alt="Trade Analysis Zoomed"
            className="max-w-full max-h-full object-contain shadow-2xl rounded-lg border border-white/5"
          />
        </div>
      )}

      <div className="flex justify-between items-center border-b border-border pb-6">
        <div className="flex items-center gap-4">
          <Link href="/trades" className="p-2 hover:bg-neutral-900 rounded-md transition-colors text-muted-foreground hover:text-white border border-transparent hover:border-border">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-[10px] font-black px-2 py-0.5 rounded tracking-widest uppercase",
                isWin ? "bg-success/10 text-success border border-success/20" :
                isLoss ? "bg-danger/10 text-danger border border-danger/20" :
                "bg-neutral-800 text-neutral-400 border border-neutral-700"
              )}>
                {trade.direction} {trade.result}
              </span>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{trade.account?.name || "Terminal"}</span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              {trade.symbol} <span className="text-neutral-500 font-medium ml-2">/ ID: {trade.id.slice(-6).toUpperCase()}</span>
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/trades/${trade.id}/edit`} className="flex items-center gap-2 bg-neutral-900 border border-border text-white px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all active:scale-95">
            <Edit2 className="w-3.5 h-3.5" />
            Edit Trade
          </Link>
          <button onClick={handleDelete} className="flex items-center gap-2 bg-danger/5 border border-danger/20 text-danger px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-danger/10 transition-all active:scale-95">
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> Execution Details
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Entry Price</span>
                <span className="font-bold text-white tabular-nums">{trade.entryPrice?.toFixed(5) || "0.00000"}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Exit Price</span>
                <span className="font-bold text-white tabular-nums">{trade.exitPrice?.toFixed(5) || "-"}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-danger/70 border-t border-border pt-4">
                <span className="font-medium">Stop Loss</span>
                <span className="font-bold tabular-nums">{trade.stopLoss?.toFixed(5) || "-"}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-success/70">
                <span className="font-medium">Take Profit</span>
                <span className="font-bold tabular-nums">{trade.takeProfit?.toFixed(5) || "-"}</span>
              </div>
              <div className="pt-4 border-t border-border flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">Position Size</span>
                <span className="font-black text-white">{trade.lotSize} Lots</span>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Context
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs font-bold text-white uppercase">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span>{trade.date ? format(new Date(trade.date), 'EEEE, MMM d, yyyy') : "N/A"}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-white uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span>{trade.date ? format(new Date(trade.date), 'HH:mm') : "N/A"} • {trade.session || "N/A"} SESSION</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-white uppercase">
                <Smile className="w-3.5 h-3.5 text-neutral-500" />
                <span>FEELING: <span className={cn("font-black", isWin ? "text-success" : isLoss ? "text-danger" : "text-neutral-400")}>{trade.emotion?.toUpperCase() || "NEUTRAL"}</span></span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-6">
          <div className={cn(
            "bg-card border rounded-xl overflow-hidden shadow-2xl relative group transition-all duration-300 border-t-4",
            isWin ? "border-success shadow-success/10" : isLoss ? "border-danger shadow-danger/10" : "border-border"
          )}>
            <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsZoomed(true)}
                className="bg-black/60 backdrop-blur-md p-2 rounded-md hover:bg-black/80 border border-white/10"
              >
                <Maximize2 className="w-5 h-5 text-white" />
              </button>
            </div>
            <div
              className="aspect-[16/9] w-full bg-neutral-950 flex flex-col items-center justify-center text-muted-foreground relative overflow-hidden cursor-zoom-in"
              onClick={() => setIsZoomed(true)}
            >
               <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
               {mainImage ? (
                 <img src={mainImage.url} alt="Execution Replay" className="w-full h-full object-contain relative z-10 transition-transform duration-700 group-hover:scale-[1.03]" />
               ) : (
                 <div className="flex flex-col items-center opacity-20">
                   <ImageIcon className="w-16 h-16 mb-4" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em]">No Chart Recorded</p>
                 </div>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-success flex items-center gap-2">
                <BrainCircuit className="w-3.5 h-3.5" /> Logic / Plan
              </h3>
              <p className="text-[11px] font-medium text-neutral-300 leading-relaxed italic min-h-[100px]">
                {trade.preTradePlan || "Zero log records for this execution logic."}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Reality / Review
              </h3>
              <p className="text-[11px] font-medium text-neutral-300 leading-relaxed italic min-h-[100px]">
                {trade.postTradeReview || "Zero log records for post-execution reality."}
              </p>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className={cn(
            "bg-card border rounded-xl overflow-hidden shadow-2xl transition-all border-t-4",
            isWin ? "border-success shadow-success/10" : isLoss ? "border-danger shadow-danger/10" : "border-border"
          )}>
             <div className={cn("p-8 text-center border-b border-border", isWin ? "bg-success/5" : isLoss ? "bg-danger/5" : "bg-neutral-900/10")}>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-2">Net Realized Delta</p>
                <h3 className={cn("text-4xl font-black tracking-tighter mb-2 tabular-nums", isWin ? "text-success" : isLoss ? "text-danger" : "text-neutral-400")}>
                  {pnlValue >= 0 ? "+" : ""}{formatCurrency(pnlValue, trade.account?.currency || "USD")}
                </h3>
                <div className="flex justify-center items-center gap-3">
                   <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest", isWin ? "bg-success text-white" : isLoss ? "bg-danger text-white" : "bg-neutral-800 text-neutral-400")}>
                     {(trade.actualR || 0).toFixed(2)}R
                   </span>
                   <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{trade.result}</span>
                </div>
             </div>
             <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Risk Model</span>
                    <span className="text-xs font-bold text-white tabular-nums">{trade.riskPercent?.toFixed(2) || "0.00"}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Capital at Risk</span>
                    <span className="text-xs font-bold text-white tabular-nums">{trade.riskAmount ? formatCurrency(trade.riskAmount, trade.account?.currency || "USD") : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border/50">
                    <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Terminal Change</span>
                    <span className={cn("text-xs font-black tabular-nums", isWin ? "text-success" : isLoss ? "text-danger" : "text-neutral-400")}>
                      {pnlValue >= 0 ? "+" : ""}{trade.account?.initialBalance ? ((pnlValue / trade.account.initialBalance) * 100).toFixed(2) : "0.00"}%
                    </span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
