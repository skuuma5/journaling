import dynamic from 'next/dynamic'
import { Suspense } from "react"
import { Loader2 } from "lucide-react"

// Force l-page t-khdem dima dynamic
export const dynamic = 'force-dynamic';

// Import l-Client Component m3a ssr: false (kat-7iyd l-mouchkil dyal useSearchParams f-l-build)
const AnalyticsClient = dynamic(() => import('./AnalyticsClient'), {
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
