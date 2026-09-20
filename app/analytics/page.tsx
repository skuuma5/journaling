import { Suspense } from "react"
import { Loader2 } from "lucide-react"
import AnalyticsClient from "./AnalyticsClient"

export const dynamic = 'force-dynamic';

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
        <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Syncing Analytics Terminal...</p>
      </div>
    }>
      <AnalyticsClient />
    </Suspense>
  )
}
