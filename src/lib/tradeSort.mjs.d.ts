export type SortableTrade = {
  tradeDate: string;
  createdAt: string;
};

export function sortTradesNewestFirst<T extends SortableTrade>(trades: T[]): T[];
