export function calculateTradeMetrics(params: {
  entry: number;
  exit: number | null;
  sl: number | null;
  tp: number | null;
  lots: number;
  direction: string;
  accountBalance: number;
}) {
  const { entry, exit, sl, tp, lots, direction, accountBalance } = params;

  // 1. Calculate Risk Amount (at entry)
  let riskAmount = 0;
  let riskPercent = 0;
  if (sl !== null && sl !== 0) {
    const riskPips = direction === "BUY" ? (entry - sl) : (sl - entry);
    // Standard mock: $10 per pip for 1 lot
    riskAmount = riskPips * lots * 10;
    if (accountBalance > 0) {
      riskPercent = (riskAmount / accountBalance) * 100;
    }
  }

  // 2. Calculate Planned R:R (at entry)
  let rewardToRisk = 0;
  if (sl !== null && tp !== null && sl !== entry) {
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    rewardToRisk = reward / risk;
  }

  // 3. Calculate Realized P&L and R (at exit)
  let pnl = 0;
  let actualR = 0;
  if (exit !== null && exit !== 0) {
    const pips = direction === "BUY" ? (exit - entry) : (entry - exit);
    pnl = pips * lots * 10;

    if (riskAmount !== 0) {
      actualR = pnl / riskAmount;
    }
  }

  return {
    pnl,
    riskAmount,
    riskPercent,
    rewardToRisk,
    actualR
  };
}
