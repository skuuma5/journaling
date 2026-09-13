"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { Activity, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage("Error: " + error.message)
    } else {
      setMessage("Check your email for the login link!")
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-2xl">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-white rounded-md flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Terminal Access</h2>
          <p className="text-muted-foreground text-sm mt-2">Enter your email to receive a magic link.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Email Address</label>
            <input
              type="email"
              placeholder="trader@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-neutral-900 border border-border rounded-md px-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-md font-black text-xs uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Magic Link"}
          </button>
        </form>

        {message && (
          <p className={cn(
            "text-center text-xs font-bold uppercase tracking-widest p-3 rounded border",
            message.startsWith("Error") ? "bg-danger/10 border-danger/20 text-danger" : "bg-success/10 border-success/20 text-success"
          )}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
