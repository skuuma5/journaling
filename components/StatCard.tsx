import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  trend?: "up" | "down" | "neutral"
  className?: string
}

export function StatCard({ label, value, subValue, trend, className }: StatCardProps) {
  return (
    <div className={cn("bg-card border border-border rounded-lg p-5 flex flex-col gap-1", className)}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className={cn(
          "text-2xl font-bold",
          trend === "up" && "text-success",
          trend === "down" && "text-danger",
          trend === "neutral" && "text-white"
        )}>
          {value}
        </h3>
        {subValue && (
          <span className="text-xs text-muted-foreground">{subValue}</span>
        )}
      </div>
    </div>
  )
}
