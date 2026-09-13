import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createClient } from '@/lib/supabase-server'
import { calculateTradeMetrics } from "@/lib/trading-calculations"

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')
  const strategyId = searchParams.get('strategyId')

  try {
    const trades = await prisma.trade.findMany({
      where: {
        account: { userId: user.id }, // أمان: جلب صفقات هذا المستخدم فقط
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
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

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

    // التأكد من أن الحساب يخص المستخدم الحالي
    const account = await prisma.account.findUnique({
      where: { id: accountId, userId: user.id }
    })

    if (!account) return NextResponse.json({ error: "Account not found or access denied" }, { status: 404 })

    const metrics = calculateTradeMetrics({
      entry: parseFloat(entryPrice) || 0,
      exit: exitPrice ? parseFloat(exitPrice) : null,
      sl: stopLoss ? parseFloat(stopLoss) : null,
      tp: takeProfit ? parseFloat(takeProfit) : null,
      lots: parseFloat(lotSize) || 0,
      direction,
      accountBalance: account.currentBalance
    })

    const finalPnl = pnl !== null && pnl !== undefined && pnl !== "" ? parseFloat(pnl) : metrics.pnl
    const finalActualR = actualR !== null && actualR !== undefined && actualR !== "" ? parseFloat(actualR) : metrics.actualR

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
          // ربط الأخطاء بالمستخدم الحالي
          mistakes: {
            connectOrCreate: (mistakes || []).map((m: string) => ({
              where: { name_userId: { name: m, userId: user.id } },
              create: { name: m, userId: user.id }
            }))
          },
          // ربط التاغات بالمستخدم الحالي
          tags: {
            create: (tags || []).map((t: string) => ({
              tag: {
                connectOrCreate: {
                  where: { name_userId: { name: t, userId: user.id } },
                  create: { name: t, userId: user.id }
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

      await tx.account.update({
        where: { id: accountId },
        data: {
          currentBalance: {
            increment: finalPnl
          }
        }
      })

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
