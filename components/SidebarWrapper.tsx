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

  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/auth')

  if (!mounted) return null

  return (
    <div className="flex min-h-screen bg-background">
      {!isAuthPage && <Sidebar />}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300 w-full",
        // pt-32 on mobile (lg:pt-8) to give enough space below the fixed header
        !isAuthPage ? "lg:ml-64 pt-32 lg:pt-8 p-4 md:p-8" : "ml-0 p-4 md:p-8"
      )}>
        <div className="max-w-[1400px] mx-auto overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}
