"use client";
import { useState } from "react";
import type { Trade } from "@/lib/tradeTypes";
import { EmptyState } from "@/components/ui/EmptyState";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

type Props = {
  trades: Trade[];
  isLoading: boolean;
  selectedTradeId: string | null;
  onSelect: (id: string) => void;
};

export function TradeList({ trades, isLoading, selectedTradeId, onSelect }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query
    ? trades.filter((t) =>
        t.description.toLowerCase().includes(query.toLowerCase()),
      )
    : trades;

  return (
    <section className="panel trade-history-panel">
      <div className="section-heading">
        <h2>Trade history</h2>
        <span>
          {isLoading
            ? "Loading…"
            : query
            ? `${filtered.length} of ${trades.length} trades`
            : `${trades.length} saved`}
        </span>
      </div>

      <input
        className="trade-search"
        type="search"
        placeholder="Search trades…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search trades by description"
      />

      {filtered.length ? (
        <div className="trade-list">
          {filtered.map((trade) => (
            <article
              key={trade.id}
              className={`trade-card trade-list-item ${trade.result} ${
                selectedTradeId === trade.id ? "selected" : ""
              }`}
            >
              <button
                type="button"
                className="trade-card-button"
                onClick={() => onSelect(trade.id)}
                aria-label={`Open trade from ${trade.tradeDate}`}
              >
                <div className="trade-main">
                  <div>
                    <p className="trade-date">{trade.tradeDate}</p>
                    <h3>{trade.description}</h3>
                  </div>
                  <div className="trade-result">
                    <strong>{currency.format(trade.profitLoss)}</strong>
                    <span>{trade.profitLossPercent.toFixed(2)}%</span>
                  </div>
                </div>
              </button>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          text={
            query
              ? "No trades match your search."
              : "Add your first trade to start building your summary."
          }
        />
      )}
    </section>
  );
}
