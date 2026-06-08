import type { TradeResult } from "./tradeMath";

export type ScreenshotAsset = {
  name: string;
  type: string;
  dataUrl: string;
};

export type BalanceTrade = {
  mode: "balance";
  startingAmount: number;
  endingAmount: number;
};

export type DetailedTrade = {
  mode: "detailed";
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  fees: number;
};

export type Trade = {
  id: string;
  createdAt: string;
  updatedAt: string;
  tradeDate: string;
  description: string;
  beforeScreenshot: ScreenshotAsset | null;
  afterScreenshot: ScreenshotAsset | null;
  profitLoss: number;
  profitLossPercent: number;
  result: TradeResult;
} & (BalanceTrade | DetailedTrade);
