import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createClient } from '@/lib/supabase-server'
import { calculateTradeMetrics } from "@/lib/trading-calculations"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const trade = await prisma.trade.findUnique({
      where: {
        id: params.id,
        account: { userId: user.id }
      },
      include: {
        account: true,
        strategy: true,
        tags: { include: { tag: true } },
        mistakes: true,
        images: true,
      },
    })

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    return NextResponse.json(trade)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch trade" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const trade = await prisma.trade.findUnique({
      where: {
        id: params.id,
        account: { userId: user.id }
      },
    })

    if (!trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      if (trade.pnl) {
        await tx.account.update({
          where: { id: trade.accountId },
          data: {
            currentBalance: {
              decrement: trade.pnl,
            },
          },
        })
      }

      await tx.trade.delete({
        where: { id: params.id },
      })
    })

    return NextResponse.json({ message: "Trade deleted successfully" })
  } catch (error) {
    console.error("TRADE_DELETE_ERROR", error)
    return NextResponse.json({ error: "Failed to delete trade" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const {
      symbol, direction, entryPrice, exitPrice, stopLoss,
      takeProfit, lotSize, date, time, session, strategyId,
      notes, preTradePlan, postTradeReview, emotion, result,
      mistakes, tags, pnl, actualR, audioId, audioUrl
    } = body

    const oldTrade = await prisma.trade.findUnique({
      where: { id: params.id, account: { userId: user.id } },
      include: { account: true }
    })

    if (!oldTrade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    const metrics = calculateTradeMetrics({
      entry: parseFloat(entryPrice) || 0,
      exit: exitPrice ? parseFloat(exitPrice) : null,
      sl: stopLoss ? parseFloat(stopLoss) : null,
      tp: takeProfit ? parseFloat(takeProfit) : null,
      lots: parseFloat(lotSize),
      direction,
      accountBalance: oldTrade.account.currentBalance - (oldTrade.pnl || 0)
    })

    const finalPnl = pnl !== null && pnl !== undefined && pnl !== "" ? parseFloat(pnl) : metrics.pnl
    const finalActualR = actualR !== null && actualR !== undefined && actualR !== "" ? parseFloat(actualR) : metrics.actualR

    let finalResult = result || "BREAKEVEN"
    if (!result) {
      if (finalPnl > 0) finalResult = "WIN"
      else if (finalPnl < 0) finalResult = "LOSS"
    }

    const tradeDate = new Date(`${date}T${time}`)

    const updatedTrade = await prisma.$transaction(async (tx) => {
      if (oldTrade.pnl) {
        await tx.account.update({
          where: { id: oldTrade.accountId },
          data: { currentBalance: { decrement: oldTrade.pnl } }
        })
      }

      const trade = await tx.trade.update({
        where: { id: params.id },
        data: {
          symbol: symbol.toUpperCase(),
          direction,
          entryPrice: parseFloat(entryPrice) || 0,
          exitPrice: exitPrice ? parseFloat(exitPrice) : null,
          stopLoss: stopLoss ? parseFloat(stopLoss) : null,
          takeProfit: takeProfit ? parseFloat(takeProfit) : null,
          lotSize: parseFloat(lotSize),
          date: tradeDate,
          session,
          strategyId: strategyId || null,
          notes,
          preTradePlan,
          postTradeReview,
          emotion,
          result: finalResult,
          pnl: finalPnl,
          actualR: finalActualR,
          riskAmount: metrics.riskAmount,
          riskPercent: metrics.riskPercent,
          rewardToRisk: metrics.rewardToRisk,
          status: "CLOSED",
          audioId: audioId !== undefined ? audioId : oldTrade.audioId,
          audioUrl: audioUrl !== undefined ? audioUrl : oldTrade.audioUrl,
          mistakes: {
            set: [],
            connectOrCreate: (mistakes || []).map((m: string) => ({
              where: { name_userId: { name: m, userId: user.id } },
              create: { name: m, userId: user.id }
            }))
          },
          tags: {
            deleteMany: {},
            create: (tags || []).map((t: string) => ({
              tag: {
                connectOrCreate: {
                  where: { name_userId: { name: t, userId: user.id } },
                  create: { name: t, userId: user.id }
                }
              }
            }))
          }
        }
      })

      await tx.account.update({
        where: { id: oldTrade.accountId },
        data: { currentBalance: { increment: finalPnl } }
      })

      return trade
    })

    return NextResponse.json(updatedTrade)
  } catch (error) {
    console.error("TRADE_PATCH_ERROR", error)
    return NextResponse.json({ error: "Failed to update trade" }, { status: 500 })
  }
}
