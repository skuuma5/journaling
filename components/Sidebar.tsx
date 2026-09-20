"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/auth')

  useEffect(() => {
    async function checkAuthAndFetchData() {
      if (isAuthPage) {
        setIsAuthenticated(false)
        setLoading(false)
        return
      }

      try {
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) {
          setIsAuthenticated(false)
          setLoading(false)
          return
        }

        setIsAuthenticated(true)
        const accRes = await fetch('/api/accounts')
        if (accRes.ok) {
          const data = await accRes.json()
          if (Array.isArray(data)) {
            setAccounts(data)
          }
        }
      } catch (e) {
        setIsAuthenticated(false)
      } finally {
        setLoading(false)
      }
    }
    checkAuthAndFetchData()
  }, [pathname, isAuthPage])

  const toggleSidebar = () => setIsOpen(!isOpen)
  const closeSidebar = () => setIsOpen(false)

  // CRITICAL: Return null if on auth page or not logged in
  if (isAuthPage || (!isAuthenticated && !loading)) return null
  if (loading) return null

  // Logic: If user has NO accounts, only show "Accounts" and "Settings"
  const hasAccounts = accounts.length > 0
  const filteredMenuItems = menuItems.filter(item => {
    if (!hasAccounts) {
      return item.name === "Accounts" || item.name === "Settings"
    }
    return true
  })

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-card border border-border rounded-md text-white"
        onClick={toggleSidebar}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[50] lg:hidden" onClick={closeSidebar} />
      )}

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
          {filteredMenuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeSidebar}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-bold rounded-md transition-all group",
                pathname === item.href ? "bg-white text-black" : "text-muted-foreground hover:bg-neutral-900 hover:text-white"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}

          {!hasAccounts && (
            <div className="mt-4 px-3 py-4 bg-primary/5 border border-primary/10 rounded-md">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-tight">Initialization Required</p>
              <p className="text-[9px] text-muted-foreground mt-1 font-medium">Create a trading terminal to unlock full analytics.</p>
            </div>
          )}
        </nav>

        {hasAccounts && (
          <div className="p-4 border-t border-border bg-neutral-900/10">
            <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Terminals</p>
            <div className="space-y-2">
              {accounts.slice(0, 3).map((account) => (
                <Link
                  key={account.id}
                  href={`/accounts/${account.id}`}
                  onClick={closeSidebar}
                  className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-900/50"
                >
                  <div className={cn("w-2 h-2 rounded-full", account.status === "HEALTHY" ? "bg-success" : "bg-danger")} />
                  <p className="text-[10px] font-black text-white truncate uppercase">{account.name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
