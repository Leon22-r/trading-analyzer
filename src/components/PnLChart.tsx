"use client";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export type EquityPoint = { date: string; value: number };

type Props = { equityPoints: EquityPoint[] };

export function PnLChart({ equityPoints }: Props) {
  if (!equityPoints.length) return null;

  const finalValue = equityPoints[equityPoints.length - 1].value;
  const color = finalValue >= 0 ? "#039855" : "#d92d20";

  return (
    <section className="panel pnl-chart-panel">
      <div className="section-heading">
        <h2>Equity curve</h2>
        <span
          style={{ fontWeight: 700, color: finalValue >= 0 ? "#05603a" : "#912018" }}
        >
          {currency.format(finalValue)}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={equityPoints}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => d.slice(5)}
            tick={{ fontSize: 11, fill: "#667085" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => currency.format(v)}
            tick={{ fontSize: 11, fill: "#667085" }}
            axisLine={false}
            tickLine={false}
            width={72}
          />
          <Tooltip
            formatter={(value) => [currency.format(Number(value)), "Cumulative P/L"]}
            labelStyle={{ color: "#182230", fontWeight: 700 }}
            contentStyle={{
              border: "1px solid #d0d5dd",
              borderRadius: 8,
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill="url(#pnlGradient)"
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </section>
  );
}
