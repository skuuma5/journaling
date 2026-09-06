import { Settings, User, Bell, Shield, Wallet, Monitor } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div>
        <h2 className="text-3xl font-bold text-white">Settings</h2>
        <p className="text-muted-foreground">Manage your profile, preferences, and API integrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md bg-secondary text-white">
            <User className="w-4 h-4" /> General
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-neutral-900 hover:text-white transition-colors">
            <Bell className="w-4 h-4" /> Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-neutral-900 hover:text-white transition-colors">
            <Shield className="w-4 h-4" /> Security
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-neutral-900 hover:text-white transition-colors">
            <Wallet className="w-4 h-4" /> Billing
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-neutral-900 hover:text-white transition-colors">
            <Monitor className="w-4 h-4" /> Display
          </button>
        </div>

        <div className="md:col-span-3 space-y-8">
          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            <h3 className="font-bold text-lg border-b border-border pb-4">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Display Name</label>
                <input type="text" defaultValue="Professional Trader" className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-white/20 outline-none" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Email Address</label>
                <input type="email" defaultValue="trader@example.com" className="w-full bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-white/20 outline-none" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-6">
            <h3 className="font-bold text-lg border-b border-border pb-4">Trading Preferences</h3>
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Default Currency</p>
                    <p className="text-xs text-muted-foreground">Select your primary reporting currency.</p>
                  </div>
                  <select className="bg-neutral-900 border border-border rounded-md px-3 py-2 text-sm outline-none">
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                    <option>GBP (£)</option>
                  </select>
               </div>
               <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="text-sm font-bold text-white">Calculate P&L automatically</p>
                    <p className="text-xs text-muted-foreground">Use our engine to calculate P&L based on entry/exit.</p>
                  </div>
                  <div className="w-10 h-5 bg-success rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                  </div>
               </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
             <button className="px-6 py-2 border border-border rounded-md text-sm font-bold hover:bg-neutral-900 transition-colors">Cancel</button>
             <button className="px-6 py-2 bg-white text-black rounded-md text-sm font-bold hover:bg-neutral-200 transition-colors">Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  )
}
