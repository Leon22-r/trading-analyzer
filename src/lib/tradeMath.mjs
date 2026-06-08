export function roundMoney(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function classifyResult(profitLoss) {
  if (profitLoss > 0) return "profit";
  if (profitLoss < 0) return "loss";
  return "breakEven";
}

export function calculateBalanceResult(startingAmount, endingAmount) {
  const profitLoss = roundMoney(endingAmount - startingAmount);
  const profitLossPercent =
    startingAmount === 0 ? 0 : roundMoney((profitLoss / startingAmount) * 100);

  return {
    profitLoss,
    profitLossPercent,
    result: classifyResult(profitLoss),
  };
}

export function calculateDetailedResult({
  entryPrice,
  exitPrice,
  quantity,
  fees = 0,
}) {
  const basis = entryPrice * quantity;
  const profitLoss = roundMoney((exitPrice - entryPrice) * quantity - fees);
  const profitLossPercent = basis === 0 ? 0 : roundMoney((profitLoss / basis) * 100);

  return {
    profitLoss,
    profitLossPercent,
    result: classifyResult(profitLoss),
  };
}

export function summarizeTrades(trades) {
  const tradeCount = trades.length;
  const totalProfitLoss = roundMoney(
    trades.reduce((total, trade) => total + trade.profitLoss, 0),
  );
  const winningTrades = trades.filter((trade) => trade.result === "profit").length;
  const winRate = tradeCount === 0 ? 0 : roundMoney((winningTrades / tradeCount) * 100);
  const averageReturnPercent =
    tradeCount === 0
      ? 0
      : roundMoney(
          trades.reduce((total, trade) => total + trade.profitLossPercent, 0) /
            tradeCount,
        );

  return {
    tradeCount,
    totalProfitLoss,
    winRate,
    averageReturnPercent,
  };
}
