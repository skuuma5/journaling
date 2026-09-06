import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { calculateTradeMetrics } from "@/lib/trading-calculations"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')
  const strategyId = searchParams.get('strategyId')

  try {
    const trades = await prisma.trade.findMany({
      where: {
        AND: [
          accountId && accountId !== 'all' ? { accountId } : {},
          strategyId ? { strategyId } : {},
        ]
      },
      include: {
        account: true,
        tags: { include: { tag: true } },
        mistakes: true,
        strategy: true,
        images: true,
      },
      orderBy: { date: 'desc' }
    })
    return NextResponse.json(trades)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      accountId, symbol, direction, entryPrice, exitPrice, stopLoss,
      takeProfit, lotSize, date, time, session, strategyId,
      notes, preTradePlan, postTradeReview, emotion, result,
      mistakes, tags, pnl, actualR, imageUrl
    } = body

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 })
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } })
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 })

    const metrics = calculateTradeMetrics({
      entry: parseFloat(entryPrice) || 0,
      exit: exitPrice ? parseFloat(exitPrice) : null,
      sl: stopLoss ? parseFloat(stopLoss) : null,
      tp: takeProfit ? parseFloat(takeProfit) : null,
      lots: parseFloat(lotSize) || 0,
      direction,
      accountBalance: account.currentBalance
    })

    // Manual P&L and Manual R multiple support
    const finalPnl = pnl !== null && pnl !== undefined && pnl !== "" ? parseFloat(pnl) : metrics.pnl
    const finalActualR = actualR !== null && actualR !== undefined && actualR !== "" ? parseFloat(actualR) : metrics.actualR

    // Enforce Result logic: Result follows P&L
    let finalResult = "BREAKEVEN"
    if (finalPnl > 0) finalResult = "WIN"
    else if (finalPnl < 0) finalResult = "LOSS"

    const tradeDate = new Date(`${date}T${time}`)

    const trade = await prisma.$transaction(async (tx) => {
      const newTrade = await tx.trade.create({
        data: {
          accountId,
          symbol: symbol.toUpperCase(),
          direction,
          entryPrice: parseFloat(entryPrice) || 0,
          exitPrice: exitPrice ? parseFloat(exitPrice) : null,
          stopLoss: stopLoss ? parseFloat(stopLoss) : null,
          takeProfit: takeProfit ? parseFloat(takeProfit) : null,
          lotSize: parseFloat(lotSize) || 0,
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
          mistakes: {
            connectOrCreate: (mistakes || []).map((m: string) => ({
              where: { name: m },
              create: { name: m }
            }))
          },
          tags: {
            create: (tags || []).map((t: string) => ({
              tag: {
                connectOrCreate: {
                  where: { name: t },
                  create: { name: t }
                }
              }
            }))
          },
          images: imageUrl ? {
            create: {
              url: imageUrl,
              type: "AFTER"
            }
          } : undefined
        }
      })

      // Update account balance
      await tx.account.update({
        where: { id: accountId },
        data: {
          currentBalance: {
            increment: finalPnl
          }
        }
      })

      // Create snapshot for the chart
      await tx.accountSnapshot.create({
        data: {
          accountId,
          balance: account.currentBalance + finalPnl,
          pnl: finalPnl,
          date: tradeDate
        }
      })

      return newTrade
    })

    return NextResponse.json(trade)
  } catch (error) {
    console.error("TRADE_POST_ERROR", error)
    return NextResponse.json({ error: "Failed to create trade" }, { status: 500 })
  }
}
