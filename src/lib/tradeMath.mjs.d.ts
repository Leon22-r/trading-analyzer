export type TradeResult = "profit" | "loss" | "breakEven";

export type CalculatedTradeResult = {
  profitLoss: number;
  profitLossPercent: number;
  result: TradeResult;
};

export type SummaryInput = CalculatedTradeResult;

export type TradeSummary = {
  tradeCount: number;
  totalProfitLoss: number;
  winRate: number;
  averageReturnPercent: number;
};

export function roundMoney(value: number): number;
export function classifyResult(profitLoss: number): TradeResult;
export function calculateBalanceResult(
  startingAmount: number,
  endingAmount: number,
): CalculatedTradeResult;
export function calculateDetailedResult(input: {
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  fees?: number;
}): CalculatedTradeResult;
export function summarizeTrades(trades: SummaryInput[]): TradeSummary;
