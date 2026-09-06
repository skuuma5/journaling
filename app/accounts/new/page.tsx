"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, CreditCard } from "lucide-react"
import Link from "next/link"

export default function NewAccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    initialBalance: "",
    currency: "USD",
    profitTarget: "",
    maxDrawdown: "",
    dailyLossLimit: "",
    accountType: "EVALUATION",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          initialBalance: parseFloat(formData.initialBalance),
          profitTarget: formData.profitTarget ? parseFloat(formData.profitTarget) : null,
          maxDrawdown: formData.maxDrawdown ? parseFloat(formData.maxDrawdown) : null,
          dailyLossLimit: formData.dailyLossLimit ? parseFloat(formData.dailyLossLimit) : null,
          userId: "default-user" // Mock user ID
        }),
      })

      if (res.ok) {
        router.push('/accounts')
        router.refresh()
      } else {
        alert("Failed to create account")
      }
    } catch (error) {
      console.error(error)
      alert("Error creating account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/accounts" className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-white">Create Account</h2>
            <p className="text-muted-foreground">Setup a new trading account or challenge.</p>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Account Name</label>
              <input
                type="text"
                name="name"
                placeholder="e.g. FTMO 100K Challenge"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Initial Balance</label>
              <input
                type="number"
                name="initialBalance"
                placeholder="10000"
                value={formData.initialBalance}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Account Type</label>
              <select
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
              >
                <option value="EVALUATION">Evaluation / Challenge</option>
                <option value="FUNDED">Funded</option>
                <option value="LIVE">Live Personal</option>
                <option value="DEMO">Demo</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Profit Target (Optional)</label>
              <input
                type="number"
                name="profitTarget"
                placeholder="1000"
                value={formData.profitTarget}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Max Drawdown (Optional)</label>
              <input
                type="number"
                name="maxDrawdown"
                placeholder="500"
                value={formData.maxDrawdown}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Daily Loss Limit (Optional)</label>
              <input
                type="number"
                name="dailyLossLimit"
                placeholder="250"
                value={formData.dailyLossLimit}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-3 rounded-md font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating..." : (
                <>
                  <Save className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
            <Link
              href="/accounts"
              className="px-6 py-3 border border-border rounded-md font-bold hover:bg-secondary transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
