import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createClient } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const trades = await prisma.trade.findMany({
      where: { account: { userId: user.id } },
      include: {
        account: true,
        strategy: true,
        mistakes: true,
        images: true,
        tags: { include: { tag: true } }
      },
      orderBy: { date: 'desc' }
    })

    let markdown = `# 📊 Trading Journal Export for AI Analysis\n`
    markdown += `**User:** ${user.email}\n`
    markdown += `**Export Date:** ${new Date().toLocaleString()}\n`
    markdown += `**Total Trades:** ${trades.length}\n\n`
    markdown += `> This file is optimized for ChatGPT, Claude, and other LLMs. Upload this file and ask: "Analyze my trading performance, identify patterns in my mistakes, and suggest improvements based on my notes and results."\n\n`
    markdown += `---\n\n`

    trades.forEach((trade, index) => {
      const tradeNum = trades.length - index
      markdown += `## 🟢 Trade #${tradeNum}: ${trade.symbol} (${trade.direction})\n`
      markdown += `### 📝 Execution Details\n`
      markdown += `- **Date/Time:** ${new Date(trade.date).toLocaleString()}\n`
      markdown += `- **Result:** ${trade.result} (${trade.pnl} ${trade.account.currency})\n`
      markdown += `- **Entry Price:** ${trade.entryPrice}\n`
      markdown += `- **Exit Price:** ${trade.exitPrice || 'N/A'}\n`
      markdown += `- **Stop Loss:** ${trade.stopLoss || 'N/A'}\n`
      markdown += `- **Take Profit:** ${trade.takeProfit || 'N/A'}\n`
      markdown += `- **Position Size:** ${trade.lotSize} lots\n`
      markdown += `- **RR Ratio:** ${trade.rewardToRisk || 'N/A'} (Planned) | **Actual R:** ${trade.actualR || 'N/A'}\n`

      markdown += `### 🌐 Context\n`
      markdown += `- **Session:** ${trade.session || 'N/A'}\n`
      markdown += `- **Timeframe:** ${trade.timeframe || 'N/A'}\n`
      markdown += `- **Market Condition:** ${trade.marketCondition || 'N/A'}\n`
      markdown += `- **Strategy:** ${trade.strategy?.name || 'None'}\n`
      markdown += `- **Emotion:** ${trade.emotion || 'Not recorded'}\n`

      if (trade.mistakes.length > 0) {
        markdown += `- **Mistakes Identified:** ${trade.mistakes.map(m => m.name).join(', ')}\n`
      }

      if (trade.tags.length > 0) {
        markdown += `- **Tags:** ${trade.tags.map(t => t.tag.name).join(', ')}\n`
      }

      markdown += `### 💭 Analysis & Notes\n`
      markdown += `#### Pre-Trade Plan\n${trade.preTradePlan || 'No plan recorded.'}\n\n`
      markdown += `#### Trade Notes\n${trade.notes || 'No notes.'}\n\n`
      markdown += `#### Post-Trade Review\n${trade.postTradeReview || 'No review recorded.'}\n\n`

      if (trade.images.length > 0) {
        markdown += `### 🖼️ Screenshots\n`
        trade.images.forEach((img, i) => {
          markdown += `![Trade Image ${i + 1}](${img.url})\n`
        });
        markdown += `\n`
      }

      markdown += `---\n\n`
    })

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename=trading-journal-ai-ready.md`,
      },
    })
  } catch (error) {
    console.error("AI_EXPORT_ERROR", error)
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 })
  }
}
