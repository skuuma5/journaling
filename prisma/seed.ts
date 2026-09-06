const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Create User
  const user = await prisma.user.upsert({
    where: { email: 'trader@example.com' },
    update: {},
    create: {
      email: 'trader@example.com',
      name: 'Professional Trader',
    },
  })

  // Create Strategies
  const s1 = await prisma.strategy.create({ data: { name: 'Liquidity Sweep + FVG' } })
  const s2 = await prisma.strategy.create({ data: { name: 'Order Block Rejection' } })
  const s3 = await prisma.strategy.create({ data: { name: 'Breakout & Retest' } })

  // Create Mistakes
  await prisma.mistake.create({ data: { name: 'FOMO' } })
  await prisma.mistake.create({ data: { name: 'Revenge Trading' } })
  await prisma.mistake.create({ data: { name: 'Overtrading' } })
  await prisma.mistake.create({ data: { name: 'Moved SL' } })

  // Create Accounts
  const ftmo5k = await prisma.account.create({
    data: {
      name: 'FTMO 5K Challenge',
      initialBalance: 5000,
      currentBalance: 5420,
      profitTarget: 500,
      maxDrawdown: 500,
      dailyLossLimit: 250,
      accountType: 'EVALUATION',
      status: 'HEALTHY',
      userId: user.id
    }
  })

  const funded10k = await prisma.account.create({
    data: {
      name: 'My Funded Account',
      initialBalance: 10000,
      currentBalance: 9850,
      maxDrawdown: 1000,
      dailyLossLimit: 500,
      accountType: 'FUNDED',
      status: 'WARNING',
      userId: user.id
    }
  })

  // Create Trades for FTMO 5K
  const trades = [
    { symbol: 'XAUUSD', direction: 'BUY', entryPrice: 2020.50, exitPrice: 2032.50, lotSize: 1, pnl: 120, result: 'WIN', actualR: 2.0, riskAmount: 60, date: new Date(Date.now() - 86400000 * 1) },
    { symbol: 'NAS100', direction: 'SELL', entryPrice: 17800.00, exitPrice: 17850.00, lotSize: 1, pnl: -50, result: 'LOSS', actualR: -1.0, riskAmount: 50, date: new Date(Date.now() - 86400000 * 1) },
    { symbol: 'XAUUSD', direction: 'SELL', entryPrice: 2045.00, exitPrice: 2027.00, lotSize: 1, pnl: 180, result: 'WIN', actualR: 3.0, riskAmount: 60, date: new Date(Date.now() - 86400000 * 2) },
    { symbol: 'EURUSD', direction: 'BUY', entryPrice: 1.0850, exitPrice: 1.0920, lotSize: 2, pnl: 140, result: 'WIN', actualR: 2.5, riskAmount: 56, date: new Date(Date.now() - 86400000 * 3) },
    { symbol: 'GBPUSD', direction: 'SELL', entryPrice: 1.2650, exitPrice: 1.2680, lotSize: 2, pnl: -60, result: 'LOSS', actualR: -1.0, riskAmount: 60, date: new Date(Date.now() - 86400000 * 4) },
  ]

  for (const t of trades) {
    await prisma.trade.create({
      data: {
        ...t,
        accountId: ftmo5k.id,
        strategyId: s1.id,
        session: 'NY',
        emotion: 'Calm',
        status: 'CLOSED'
      }
    })

    await prisma.accountSnapshot.create({
      data: {
        accountId: ftmo5k.id,
        balance: 5000 + t.pnl, // Simplified for seed
        pnl: t.pnl,
        date: t.date
      }
    })
  }

  console.log('Seed completed')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
