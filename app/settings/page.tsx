"use client"

import { Settings, User, Bell, Shield, Wallet, Monitor, Download, Trash2, BrainCircuit, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("general")
  const [isExporting, setIsExporting] = useState(false)
  const [isAiExporting, setIsAiExporting] = useState(false)
  const [userData, setUserData] = useState({ name: "Professional Trader", email: "trader@example.com" })

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          setUserData({ name: data.name || data.username || "Trader", email: data.email || "" })
        }
      } catch (e) {
        console.error("Failed to fetch user data")
      }
    }
    fetchUser()
  }, [])

  const handleExport = async () => {
    setIsExporting(true)
    try {
      window.location.href = '/api/export'
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setTimeout(() => setIsExporting(false), 2000)
    }
  }

  const handleAiExport = async () => {
    setIsAiExporting(true)
    try {
      window.location.href = '/api/export/ai'
    } catch (error) {
      console.error('AI Export failed:', error)
      alert('Failed to export AI data. Please try again.')
    } finally {
      setTimeout(() => setIsAiExporting(false), 2000)
    }
  }

  const handleLogout = async () => {
    // Clear local session cookie by calling a logout endpoint or just clearing it client-side if possible.
    // Since we used cookies().set in the API, we should have an API to clear it.
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const tabs = [
    { id: "general", label: "General", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "billing", label: "Billing", icon: Wallet },
    { id: "display", label: "Display", icon: Monitor },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Terminal Settings</h2>
        <p className="text-muted-foreground font-medium uppercase text-[10px] tracking-widest">Manage your profile, preferences, and data protocols.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest rounded-md transition-all",
                activeTab === tab.id
                  ? "bg-white text-black shadow-xl scale-[1.02]"
                  : "text-muted-foreground hover:bg-neutral-900 hover:text-white"
              )}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-danger hover:bg-danger/10 rounded-md transition-all"
            >
              <LogOut className="w-4 h-4" /> Logout System
            </button>
          </div>
        </div>

        <div className="md:col-span-3 space-y-8">
          {activeTab === "general" && (
            <>
              <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-2xl">
                <h3 className="font-black text-xs uppercase tracking-[0.3em] border-b border-border pb-4 text-neutral-400">Profile Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Display Name</label>
                    <input
                      type="text"
                      value={userData.name}
                      onChange={(e) => setUserData({...userData, name: e.target.value})}
                      className="w-full bg-neutral-900 border border-border rounded-md px-4 py-2.5 text-sm focus:ring-1 focus:ring-white/20 outline-none text-white font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Email Address</label>
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({...userData, email: e.target.value})}
                      className="w-full bg-neutral-900 border border-border rounded-md px-4 py-2.5 text-sm focus:ring-1 focus:ring-white/20 outline-none text-white font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-2xl">
                <h3 className="font-black text-xs uppercase tracking-[0.3em] border-b border-border pb-4 text-primary">AI & Data Analysis</h3>
                <div className="space-y-6">
                   <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">AI-Ready Journal Export</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Download dataset in Markdown for LLM analysis.</p>
                      </div>
                      <button
                        onClick={handleAiExport}
                        disabled={isAiExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        <BrainCircuit className="w-4 h-4" />
                        {isAiExporting ? 'Processing...' : 'Export for AI'}
                      </button>
                   </div>

                   <div className="flex items-center justify-between gap-4 pt-6 border-t border-border">
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight">Full Archive (JSON)</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Complete database record for local backup.</p>
                      </div>
                      <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-border rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-neutral-800 transition-all disabled:opacity-50 whitespace-nowrap"
                      >
                        <Download className="w-4 h-4" />
                        {isExporting ? 'Exporting...' : 'Download JSON'}
                      </button>
                   </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-2xl">
                <h3 className="font-black text-xs uppercase tracking-[0.3em] border-b border-border pb-4 text-danger">Danger Zone</h3>
                <div className="space-y-4">
                   <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-black text-white uppercase tracking-tight text-danger">Purge Terminal Data</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Permanently delete all trades, accounts and logs.</p>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 bg-danger/10 border border-danger/20 text-danger rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-danger/20 transition-all whitespace-nowrap">
                        <Trash2 className="w-4 h-4" />
                        Purge Data
                      </button>
                   </div>
                </div>
              </div>
            </>
          )}

          {activeTab !== "general" && (
            <div className="bg-card border border-border rounded-xl p-20 flex flex-col items-center justify-center text-center shadow-2xl">
              <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-6">
                <Settings className="w-8 h-8 text-neutral-500 animate-spin-slow" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{activeTab} Modules Offline</h3>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em]">These configuration parameters are currently being deployed.</p>
            </div>
          )}

          {activeTab === "general" && (
            <div className="flex justify-end gap-3 pt-4">
               <button className="px-8 py-3 border border-border rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-neutral-900 transition-all">Cancel</button>
               <button className="px-8 py-3 bg-white text-black rounded-md text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-xl">Commit Changes</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
