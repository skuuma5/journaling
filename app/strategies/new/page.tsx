"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Target } from "lucide-react"
import Link from "next/link"

export default function NewStrategyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/strategies')
        router.refresh()
      } else {
        alert("Failed to create strategy")
      }
    } catch (error) {
      console.error(error)
      alert("Error creating strategy")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/strategies" className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Define Strategy</h2>
            <p className="text-muted-foreground font-medium">Create a set of rules for your trading edge.</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Strategy Name</label>
              <input
                type="text"
                name="name"
                placeholder="e.g. Liquidity Sweep + FVG"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Description / Rules</label>
              <textarea
                name="description"
                placeholder="Explain the entry criteria, stop loss placement, and take profit logic..."
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none resize-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 rounded-md font-black text-xs uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Initializing..." : (
                <>
                  <Save className="w-4 h-4" />
                  Deploy Strategy
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-neutral-900/30 border border-border rounded-xl p-6 flex gap-4">
        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center text-success shrink-0">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1">Systematic Approach</h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Defining clear strategies allows the terminal to automatically calculate your edge, win rate, and profit factor per setup, helping you identify which models to scale and which to discard.
          </p>
        </div>
      </div>
    </div>
  )
}
