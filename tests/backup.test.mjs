import assert from "node:assert/strict";
import { test } from "node:test";

import { createBackupPayload, parseBackupPayload } from "../src/lib/backup.mjs";

test("serializes and parses a complete backup payload", () => {
  const trades = [
    {
      id: "trade-1",
      createdAt: "2026-06-07T12:00:00.000Z",
      tradeDate: "2026-06-07",
      description: "Breakout retest",
      beforeScreenshot: { name: "before.png", type: "image/png", dataUrl: "data:a" },
      afterScreenshot: { name: "after.png", type: "image/png", dataUrl: "data:b" },
      mode: "balance",
      startingAmount: 1000,
      endingAmount: 1080,
      profitLoss: 80,
      profitLossPercent: 8,
      result: "profit",
    },
  ];

  const payload = createBackupPayload(trades);
  const parsed = parseBackupPayload(JSON.stringify(payload));

  assert.equal(payload.schemaVersion, 1);
  assert.equal(payload.trades.length, 1);
  assert.deepEqual(parsed, trades);
});

test("rejects backup files without a supported schema", () => {
  assert.throws(
    () => parseBackupPayload(JSON.stringify({ schemaVersion: 99, trades: [] })),
    /Unsupported backup file/,
  );
});
