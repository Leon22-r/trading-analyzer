import assert from "node:assert/strict";
import { test } from "node:test";

import {
  calculateBalanceResult,
  calculateDetailedResult,
  summarizeTrades,
} from "../src/lib/tradeMath.mjs";

test("calculates balance-mode profit and return percent", () => {
  const result = calculateBalanceResult(1000, 1125);

  assert.equal(result.profitLoss, 125);
  assert.equal(result.profitLossPercent, 12.5);
  assert.equal(result.result, "profit");
});

test("calculates detailed-mode loss including fees", () => {
  const result = calculateDetailedResult({
    entryPrice: 200,
    exitPrice: 190,
    quantity: 3,
    fees: 2.5,
  });

  assert.equal(result.profitLoss, -32.5);
  assert.equal(result.profitLossPercent, -5.42);
  assert.equal(result.result, "loss");
});

test("summarizes trade count, win rate, total profit, and average return", () => {
  const summary = summarizeTrades([
    { profitLoss: 100, profitLossPercent: 10, result: "profit" },
    { profitLoss: -25, profitLossPercent: -2.5, result: "loss" },
    { profitLoss: 0, profitLossPercent: 0, result: "breakEven" },
  ]);

  assert.equal(summary.tradeCount, 3);
  assert.equal(summary.winRate, 33.33);
  assert.equal(summary.totalProfitLoss, 75);
  assert.equal(summary.averageReturnPercent, 2.5);
});
