"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "./Sidebar"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check if we are on an authentication page
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/auth')

  // Don't render anything until mounted to avoid hydration mismatch
  if (!mounted) return null

  return (
    <div className="flex">
      {!isAuthPage && <Sidebar />}
      <main className={cn(
        "flex-1 min-h-screen bg-background p-8 transition-all duration-300",
        (!isAuthPage && mounted) ? "lg:ml-64" : "ml-0"
      )}>
        {children}
      </main>
    </div>
  )
}
