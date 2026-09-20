import dynamicImport from 'next/dynamic'
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

// Hada segment config dyal Next.js (khass ykoun smiyto 'dynamic')
export const dynamic = 'force-dynamic';

// Hada dynamic import dyal l-component (renamed to dynamicImport bach may-kounch conflict)
const AnalyticsClient = dynamicImport(() => import('./AnalyticsClient'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <Loader2 className="w-8 h-8 text-white animate-spin" />
      <p className="text-muted-foreground font-black uppercase tracking-[0.3em] text-[10px]">Syncing Analytics Terminal...</p>
    </div>
  )
})

export default function AnalyticsPage() {
  return (
    <AnalyticsClient />
  )
}
