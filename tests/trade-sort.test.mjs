import assert from "node:assert/strict";
import { test } from "node:test";

import { sortTradesNewestFirst } from "../src/lib/tradeSort.mjs";

test("sorts trades newest first by trade date and created time", () => {
  const trades = [
    { id: "old", tradeDate: "2026-06-01", createdAt: "2026-06-01T09:00:00.000Z" },
    { id: "same-day-older", tradeDate: "2026-06-07", createdAt: "2026-06-07T09:00:00.000Z" },
    { id: "new", tradeDate: "2026-06-08", createdAt: "2026-06-08T08:00:00.000Z" },
    { id: "same-day-newer", tradeDate: "2026-06-07", createdAt: "2026-06-07T13:00:00.000Z" },
  ];

  assert.deepEqual(
    sortTradesNewestFirst(trades).map((trade) => trade.id),
    ["new", "same-day-newer", "same-day-older", "old"],
  );
});

test("does not mutate the original trade array", () => {
  const trades = [
    { id: "a", tradeDate: "2026-06-01", createdAt: "2026-06-01T09:00:00.000Z" },
    { id: "b", tradeDate: "2026-06-02", createdAt: "2026-06-02T09:00:00.000Z" },
  ];

  sortTradesNewestFirst(trades);

  assert.deepEqual(
    trades.map((trade) => trade.id),
    ["a", "b"],
  );
});
