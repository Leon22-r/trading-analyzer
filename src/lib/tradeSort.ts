import { sortTradesNewestFirst as sortTradesNewestFirstMjs } from "./tradeSort.mjs";

type SortableTrade = {
  tradeDate: string;
  createdAt: string;
};

export function sortTradesNewestFirst<T extends SortableTrade>(trades: T[]): T[] {
  return sortTradesNewestFirstMjs(trades);
}
