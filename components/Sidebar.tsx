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

  if (isAuthPage || (!isAuthenticated && !loading)) return null
  if (loading) return null

  const hasAccounts = accounts.length > 0
  const filteredMenuItems = menuItems.filter(item => {
    if (!hasAccounts) {
      return item.name === "Accounts" || item.name === "Settings"
    }
    return true
  })

  return (
    <>
      {/* Mobile Header/Toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-[60] flex items-center justify-between px-4">
        <Link href="/" onClick={closeSidebar} className="text-lg font-black tracking-tighter text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-white" />
          JOURNALING
        </Link>
        <button
          className="p-2 text-white hover:bg-neutral-900 rounded-md transition-colors"
          onClick={toggleSidebar}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[65] lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "flex flex-col h-screen w-[280px] lg:w-64 border-r border-border bg-card text-card-foreground fixed left-0 top-0 z-[70] transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 hidden lg:block">
          <Link href="/" onClick={closeSidebar} className="text-xl font-black tracking-tighter text-white flex items-center gap-2 group">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center group-hover:rotate-6 transition-transform">
              <Activity className="w-5 h-5 text-black" />
            </div>
            JOURNALING
          </Link>
        </div>

        {/* Mobile Sidebar Close Button */}
        <div className="lg:hidden p-6 flex justify-between items-center border-b border-border mb-4">
          <span className="font-black text-white tracking-widest text-xs uppercase">Terminal Menu</span>
          <button onClick={closeSidebar} className="p-2 text-muted-foreground hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 opacity-50">Main Menu</p>
          {filteredMenuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={closeSidebar}
              className={cn(
                "flex items-center gap-3 px-3 py-3 text-sm font-bold rounded-md transition-all group",
                pathname === item.href ? "bg-white text-black shadow-lg" : "text-muted-foreground hover:bg-neutral-900 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-4 h-4",
                pathname === item.href ? "text-black" : "text-muted-foreground group-hover:text-white"
              )} />
              {item.name}
            </Link>
          ))}

          {!hasAccounts && (
            <div className="mt-6 mx-3 p-4 bg-primary/5 border border-primary/10 rounded-lg">
              <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-tight">Terminal Required</p>
              <p className="text-[9px] text-muted-foreground mt-2 font-medium">Create an account to unlock all features.</p>
            </div>
          )}
        </nav>

        {hasAccounts && (
          <div className="p-4 border-t border-border bg-neutral-900/10">
            <p className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 opacity-50">Active Terminals</p>
            <div className="space-y-2">
              {accounts.slice(0, 3).map((account) => (
                <Link
                  key={account.id}
                  href={`/accounts/${account.id}`}
                  onClick={closeSidebar}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-neutral-900/50 transition-all border border-transparent",
                    pathname === `/accounts/${account.id}` ? "border-border bg-neutral-900/50" : ""
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]", account.status === "HEALTHY" ? "bg-success" : "bg-danger")} />
                  <p className="text-[10px] font-black text-white truncate uppercase tracking-tight">{account.name}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
