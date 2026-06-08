export function sortTradesNewestFirst(trades) {
  return [...trades].sort((a, b) => {
    const dateOrder = b.tradeDate.localeCompare(a.tradeDate);
    if (dateOrder !== 0) return dateOrder;

    return b.createdAt.localeCompare(a.createdAt);
  });
}
