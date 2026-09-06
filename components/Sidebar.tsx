"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Calendar,
  BookOpen,
  AlertCircle,
  ShieldCheck,
  Settings,
  History,
  Target,
  Activity,
  Menu,
  X,
  PlusCircle
} from "lucide-react"

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "Accounts", icon: CreditCard, href: "/accounts" },
  { name: "Trades", icon: History, href: "/trades" },
  { name: "Calendar", icon: Calendar, href: "/calendar" },
  { name: "Journal", icon: BookOpen, href: "/journal" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "Strategies", icon: Target, href: "/strategies" },
  { name: "Mistakes", icon: AlertCircle, href: "/mistakes" },
  { name: "Risk Management", icon: ShieldCheck, href: "/risk" },
  { name: "Settings", icon: Settings, href: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/accounts')
        const data = await res.json()
        if (Array.isArray(data)) {
          setAccounts(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchAccounts()
  }, [])

  const toggleSidebar = () => setIsOpen(!isOpen)
  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      {/* Mobile Toggle */}
      <button
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-card border border-border rounded-md text-white"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[50] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "flex flex-col h-screen w-64 border-r border-border bg-card text-card-foreground fixed left-0 top-0 z-[55] transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <Link href="/" onClick={closeSidebar} className="text-xl font-black tracking-tighter text-white flex items-center gap-2 group">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center group-hover:rotate-6 transition-transform">
              <Activity className="w-5 h-5 text-black" />
            </div>
            JOURNALING
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">Main Menu</p>
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeSidebar}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-md transition-all group",
                pathname === item.href
                  ? "bg-white text-black"
                  : "text-muted-foreground hover:bg-neutral-900 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4 transition-colors",
                pathname === item.href ? "text-black" : "text-muted-foreground group-hover:text-white"
              )} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-border bg-neutral-900/10">
          <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Terminals</p>
          <div className="space-y-2">
            {loading ? (
              <div className="px-3 py-2 text-xs text-muted-foreground italic">Loading accounts...</div>
            ) : accounts.length === 0 ? (
              <Link href="/accounts/new" onClick={closeSidebar} className="px-3 py-2 text-xs text-muted-foreground hover:text-white transition-colors flex items-center gap-2">
                <PlusCircle className="w-3 h-3" /> Add Account
              </Link>
            ) : (
              accounts.slice(0, 3).map((account) => (
                <Link
                  key={account.id}
                  href={`/accounts/${account.id}`}
                  onClick={closeSidebar}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-all border border-transparent",
                    pathname === `/accounts/${account.id}` ? "bg-neutral-900 border-border" : "hover:bg-neutral-900/50"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    account.status === "HEALTHY" ? "bg-success" :
                    account.status === "WARNING" ? "bg-yellow-500" : "bg-danger"
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-white truncate uppercase tracking-tighter">{account.name}</p>
                    <p className="text-[9px] text-muted-foreground font-mono truncate">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: account.currency }).format(account.currentBalance)}
                    </p>
                  </div>
                </Link>
              ))
            )}
            {accounts.length > 3 && (
              <Link href="/accounts" onClick={closeSidebar} className="px-3 py-1 text-[10px] font-bold text-muted-foreground hover:text-white transition-colors block text-center">
                View all {accounts.length} accounts
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
