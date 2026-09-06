import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { startOfDay } from "date-fns"

export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        trades: {
          where: {
            date: {
              gte: startOfDay(new Date())
            }
          }
        }
      }
    })

    const riskData = accounts.map(account => {
      const todayLoss = account.trades.reduce((sum, t) => {
        const pnl = t.pnl || 0
        return pnl < 0 ? sum + Math.abs(pnl) : sum
      }, 0)

      const todayPnl = account.trades.reduce((sum, t) => sum + (t.pnl || 0), 0)
      const currentDrawdown = account.initialBalance - account.currentBalance

      return {
        id: account.id,
        name: account.name,
        currency: account.currency,
        dailyLossLimit: account.dailyLossLimit || 0,
        todayLoss,
        todayPnl,
        maxDrawdownLimit: account.maxDrawdown || 0,
        currentDrawdown: Math.max(0, currentDrawdown),
        tradesToday: account.trades.length,
        status: account.status
      }
    })

    return NextResponse.json(riskData)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch risk data" }, { status: 500 })
  }
}
