"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import Link from "next/link"

export default function EditAccountPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    initialBalance: "",
    currency: "USD",
    profitTarget: "",
    maxDrawdown: "",
    dailyLossLimit: "",
    accountType: "EVALUATION",
    status: "HEALTHY"
  })

  useEffect(() => {
    async function fetchAccount() {
      try {
        const res = await fetch(`/api/accounts/${params.id}`)
        const data = await res.json()
        setFormData({
          name: data.name,
          initialBalance: data.initialBalance.toString(),
          currency: data.currency,
          profitTarget: data.profitTarget?.toString() || "",
          maxDrawdown: data.maxDrawdown?.toString() || "",
          dailyLossLimit: data.dailyLossLimit?.toString() || "",
          accountType: data.accountType || "EVALUATION",
          status: data.status || "HEALTHY"
        })
      } catch (error) {
        console.error("Failed to fetch account", error)
      } finally {
        setFetching(false)
      }
    }
    fetchAccount()
  }, [params.id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/accounts/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          initialBalance: parseFloat(formData.initialBalance),
          profitTarget: formData.profitTarget ? parseFloat(formData.profitTarget) : null,
          maxDrawdown: formData.maxDrawdown ? parseFloat(formData.maxDrawdown) : null,
          dailyLossLimit: formData.dailyLossLimit ? parseFloat(formData.dailyLossLimit) : null,
        }),
      })

      if (res.ok) {
        router.push('/accounts')
        router.refresh()
      } else {
        alert("Failed to update account")
      }
    } catch (error) {
      console.error(error)
      alert("Error updating account")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this account? All associated trades will be lost.")) return

    try {
      const res = await fetch(`/api/accounts/${params.id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.push('/accounts')
        router.refresh()
      } else {
        alert("Failed to delete account")
      }
    } catch (error) {
      console.error(error)
    }
  }

  if (fetching) return <div className="flex items-center justify-center h-[50vh]">Loading account data...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href={`/accounts/${params.id}`} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-white">Edit Account</h2>
            <p className="text-muted-foreground">Modify your account parameters or targets.</p>
          </div>
        </div>
        <button
          onClick={handleDelete}
          className="p-2 text-danger hover:bg-danger/10 rounded-md transition-colors"
          title="Delete Account"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Account Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
              >
                <option value="HEALTHY">Healthy</option>
                <option value="WARNING">Warning</option>
                <option value="NEAR_BREACH">Near Breach</option>
                <option value="BREACHED">Breached</option>
                <option value="TARGET_REACHED">Target Reached</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Account Type</label>
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
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Initial Balance</label>
              <input
                type="number"
                name="initialBalance"
                value={formData.initialBalance}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Currency</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Profit Target</label>
              <input
                type="number"
                name="profitTarget"
                value={formData.profitTarget}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Max Drawdown</label>
              <input
                type="number"
                name="maxDrawdown"
                value={formData.maxDrawdown}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Daily Loss Limit (Daily Drawdown)</label>
              <input
                type="number"
                name="dailyLossLimit"
                value={formData.dailyLossLimit}
                onChange={handleChange}
                className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none"
                placeholder="e.g. 250"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-border flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-black py-3 rounded-md font-bold hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
