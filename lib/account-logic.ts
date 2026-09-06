import { Account, Trade } from "@prisma/client"

export type AccountStatus = "HEALTHY" | "WARNING" | "NEAR_BREACH" | "BREACHED" | "TARGET_REACHED" | "INACTIVE"

export function calculateAccountStatus(account: Account & { trades: Trade[] }): AccountStatus {
  if (account.trades.length === 0) return "INACTIVE"

  const pnl = account.currentBalance - account.initialBalance

  // Check Target
  if (account.profitTarget && pnl >= account.profitTarget) return "TARGET_REACHED"

  // Check Daily Loss (Mocking today's loss for now as it needs date filtering)
  // In a real app, we'd filter trades by today's date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTrades = account.trades.filter(t => new Date(t.date) >= today)
  const todayLoss = Math.abs(todayTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))

  if (account.dailyLossLimit) {
    if (todayLoss >= account.dailyLossLimit) return "BREACHED"
    if (todayLoss >= account.dailyLossLimit * 0.8) return "NEAR_BREACH"
    if (todayLoss >= account.dailyLossLimit * 0.5) return "WARNING"
  }

  // Check Max Drawdown
  const drawdown = account.initialBalance - account.currentBalance
  if (account.maxDrawdown) {
    if (drawdown >= account.maxDrawdown) return "BREACHED"
    if (drawdown >= account.maxDrawdown * 0.8) return "NEAR_BREACH"
    if (drawdown >= account.maxDrawdown * 0.5) return "WARNING"
  }

  if (pnl < 0) return "WARNING"

  return "HEALTHY"
}

export function getStatusColor(status: AccountStatus) {
  switch (status) {
    case "HEALTHY":
    case "TARGET_REACHED":
      return "bg-success"
    case "WARNING":
      return "bg-yellow-500"
    case "NEAR_BREACH":
    case "BREACHED":
      return "bg-danger"
    default:
      return "bg-neutral-500"
  }
}
