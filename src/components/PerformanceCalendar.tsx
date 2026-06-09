// src/components/PerformanceCalendar.tsx
"use client";
import { useMemo } from "react";
import type { Trade } from "@/lib/tradeTypes";
import { EmptyState } from "@/components/ui/EmptyState";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function getDayClass(value: number) {
  if (value > 0) return "profit";
  if (value < 0) return "loss";
  return "neutral";
}

type Props = { trades: Trade[] };

export function PerformanceCalendar({ trades }: Props) {
  const calendarDays = useMemo(() => {
    const totals = new Map<string, number>();
    for (const trade of trades) {
      totals.set(
        trade.tradeDate,
        (totals.get(trade.tradeDate) ?? 0) + trade.profitLoss,
      );
    }
    return Array.from(totals.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, total]) => ({ date, total }));
  }, [trades]);

  return (
    <section className="panel">
      <div className="section-heading">
        <h2>Performance calendar</h2>
        <span>{calendarDays.length} active days</span>
      </div>
      {calendarDays.length ? (
        <div className="calendar-grid">
          {calendarDays.map((day) => (
            <div
              key={day.date}
              className={`calendar-day ${getDayClass(day.total)}`}
            >
              <span>{day.date}</span>
              <strong>{currency.format(day.total)}</strong>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState text="Logged trading days will appear here." />
      )}
    </section>
  );
}
