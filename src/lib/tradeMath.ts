import {
  calculateBalanceResult as calculateBalanceResultMjs,
  calculateDetailedResult as calculateDetailedResultMjs,
  classifyResult as classifyResultMjs,
  roundMoney as roundMoneyMjs,
  summarizeTrades as summarizeTradesMjs,
} from "./tradeMath.mjs";

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

export function roundMoney(value: number): number {
  return roundMoneyMjs(value);
}

export function classifyResult(profitLoss: number): TradeResult {
  return classifyResultMjs(profitLoss) as TradeResult;
}

export function calculateBalanceResult(
  startingAmount: number,
  endingAmount: number,
): CalculatedTradeResult {
  return calculateBalanceResultMjs(startingAmount, endingAmount) as CalculatedTradeResult;
}

export function calculateDetailedResult(input: {
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  fees?: number;
}): CalculatedTradeResult {
  return calculateDetailedResultMjs(input) as CalculatedTradeResult;
}

export function summarizeTrades(trades: SummaryInput[]): TradeSummary {
  return summarizeTradesMjs(trades) as TradeSummary;
}
