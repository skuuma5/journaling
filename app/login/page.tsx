"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Activity, Loader2, User, Lock, Mail, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { cn } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register' | 'magic'>('login')
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const supabase = createClient()

  // Clears all inputs and stops spinner when changing mode
  const changeMode = (newMode: 'login' | 'register' | 'magic') => {
    setMode(newMode)
    setUsername("")
    setPassword("")
    setEmail("")
    setShowPassword(false)
    setLoading(false)
    setMessage("")
  }

  const handleLocalAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const cleanUsername = username.trim().toLowerCase()
    const cleanPassword = password.trim()

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password: cleanPassword }),
      })

      const data = await res.json()

      if (res.ok) {
        if (mode === 'register') {
          // Success registration: Switch to login mode
          setMode('login')
          setPassword("") // Clear password for security
          setLoading(false)
          setMessage("Account created! Please log in.")
        } else {
          // Success login: Redirect to dashboard
          router.push('/')
          router.refresh()
        }
      } else {
        setMessage("Error: " + (data.error || "Authentication failed"))
        setLoading(false)
      }
    } catch (err) {
      setMessage("Error: Connection failed")
      setLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage("Error: " + error.message)
      setLoading(false)
    } else {
      setMessage("Check your email for the login link!")
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-xl border border-border shadow-2xl">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-white rounded-md flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Terminal Access</h2>
          <p className="text-muted-foreground text-sm mt-2">
            {mode === 'magic' ? "Enter email for magic link" :
             mode === 'register' ? "Create a local account" : "Sign in to your terminal"}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-neutral-900 p-1 rounded-md border border-border mb-6">
          <button
            type="button"
            onClick={() => changeMode('login')}
            className={cn(
              "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all",
              mode === 'login' ? "bg-white text-black" : "text-muted-foreground hover:text-white"
            )}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => changeMode('register')}
            className={cn(
              "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all",
              mode === 'register' ? "bg-white text-black" : "text-muted-foreground hover:text-white"
            )}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => changeMode('magic')}
            className={cn(
              "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded transition-all",
              mode === 'magic' ? "bg-white text-black" : "text-muted-foreground hover:text-white"
            )}
          >
            Online
          </button>
        </div>

        {mode === 'magic' ? (
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  name="email"
                  placeholder="trader@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-border rounded-md pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none text-white font-bold"
                  required
                  autoComplete="email"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-md font-black text-xs uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Request Magic Link"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLocalAuth} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  name="username"
                  placeholder="enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-neutral-950 border border-border rounded-md pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none text-white font-medium normal-case"
                  required
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-border rounded-md pl-10 pr-12 py-3 text-sm focus:ring-1 focus:ring-white/20 outline-none text-white font-medium"
                  required
                  autoComplete={mode === 'register' ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-black py-3 rounded-md font-black text-xs uppercase tracking-[0.2em] hover:bg-neutral-200 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'register' ? "Create Account" : "Access Terminal"}
            </button>
          </form>
        )}

        {message && (
          <p className={cn(
            "text-center text-[10px] font-bold uppercase tracking-widest p-3 rounded border",
            message.startsWith("Error") ? "bg-danger/10 border-danger/20 text-danger" : "bg-success/10 border-success/20 text-success"
          )}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
