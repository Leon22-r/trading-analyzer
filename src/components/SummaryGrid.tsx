// src/components/SummaryGrid.tsx
import type { TradeSummary } from "@/lib/tradeMath";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function getDayClass(value: number) {
  if (value > 0) return "profit";
  if (value < 0) return "loss";
  return "neutral";
}

type Props = { summary: TradeSummary };

export function SummaryGrid({ summary }: Props) {
  return (
    <section className="summary-grid" aria-label="Trading summary">
      <SummaryCard
        label="Total P/L"
        value={currency.format(summary.totalProfitLoss)}
        result={getDayClass(summary.totalProfitLoss)}
      />
      <SummaryCard label="Win rate" value={`${summary.winRate.toFixed(2)}%`} />
      <SummaryCard label="Trades" value={String(summary.tradeCount)} />
      <SummaryCard
        label="Avg return"
        value={`${summary.averageReturnPercent.toFixed(2)}%`}
        result={getDayClass(summary.averageReturnPercent)}
      />
    </section>
  );
}

function SummaryCard({
  label,
  value,
  result = "neutral",
}: {
  label: string;
  value: string;
  result?: "profit" | "loss" | "neutral";
}) {
  return (
    <article className={`summary-card ${result}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
