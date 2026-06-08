"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { createBackupPayload, parseBackupPayload } from "@/lib/backup";
import {
  calculateBalanceResult,
  calculateDetailedResult,
  summarizeTrades,
} from "@/lib/tradeMath";
import {
  deleteTrade,
  getTrades,
  replaceTrades,
  saveTrade,
} from "@/lib/storage";
import type { ScreenshotAsset, Trade } from "@/lib/tradeTypes";
import type { CalculatedTradeResult } from "@/lib/tradeMath";

type TradeMode = "balance" | "detailed";

type FormState = {
  id: string | null;
  tradeDate: string;
  description: string;
  mode: TradeMode;
  startingAmount: string;
  endingAmount: string;
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  fees: string;
  beforeScreenshot: ScreenshotAsset | null;
  afterScreenshot: ScreenshotAsset | null;
};

const emptyForm = (): FormState => ({
  id: null,
  tradeDate: new Date().toISOString().slice(0, 10),
  description: "",
  mode: "balance",
  startingAmount: "",
  endingAmount: "",
  entryPrice: "",
  exitPrice: "",
  quantity: "",
  fees: "0",
  beforeScreenshot: null,
  afterScreenshot: null,
});

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatCurrency(value: number) {
  return currency.format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function numberFromInput(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fileToAsset(file: File): Promise<ScreenshotAsset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        type: file.type,
        dataUrl: String(reader.result),
      });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function getDayClass(value: number) {
  if (value > 0) return "profit";
  if (value < 0) return "loss";
  return "neutral";
}

function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

export default function Home() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  useEffect(() => {
    registerServiceWorker();
    getTrades()
      .then(setTrades)
      .catch(() => setMessage("Could not load saved trades."))
      .finally(() => setIsLoading(false));

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const summary = useMemo(() => summarizeTrades(trades), [trades]);

  const calendarDays = useMemo(() => {
    const totals = new Map<string, number>();
    for (const trade of trades) {
      totals.set(trade.tradeDate, (totals.get(trade.tradeDate) ?? 0) + trade.profitLoss);
    }

    return Array.from(totals.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 14)
      .map(([date, total]) => ({ date, total }));
  }, [trades]);

  const selectedTrade = trades.find((trade) => trade.id === selectedTradeId) ?? null;

  async function refreshTrades() {
    setTrades(await getTrades());
  }

  async function handleScreenshot(
    event: ChangeEvent<HTMLInputElement>,
    field: "beforeScreenshot" | "afterScreenshot",
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const asset = await fileToAsset(file);
    setForm((current) => ({ ...current, [field]: asset }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const now = new Date().toISOString();
    const calculated: CalculatedTradeResult =
      form.mode === "balance"
        ? calculateBalanceResult(
            numberFromInput(form.startingAmount),
            numberFromInput(form.endingAmount),
          )
        : calculateDetailedResult({
            entryPrice: numberFromInput(form.entryPrice),
            exitPrice: numberFromInput(form.exitPrice),
            quantity: numberFromInput(form.quantity),
            fees: numberFromInput(form.fees),
          });

    const base = {
      id: form.id ?? crypto.randomUUID(),
      createdAt: form.id
        ? trades.find((trade) => trade.id === form.id)?.createdAt ?? now
        : now,
      updatedAt: now,
      tradeDate: form.tradeDate,
      description: form.description.trim(),
      beforeScreenshot: form.beforeScreenshot,
      afterScreenshot: form.afterScreenshot,
      ...calculated,
    };

    const trade: Trade =
      form.mode === "balance"
        ? {
            ...base,
            mode: "balance",
            startingAmount: numberFromInput(form.startingAmount),
            endingAmount: numberFromInput(form.endingAmount),
          }
        : {
            ...base,
            mode: "detailed",
            entryPrice: numberFromInput(form.entryPrice),
            exitPrice: numberFromInput(form.exitPrice),
            quantity: numberFromInput(form.quantity),
            fees: numberFromInput(form.fees),
          };

    await saveTrade(trade);
    await refreshTrades();
    setForm(emptyForm());
    setSelectedTradeId(trade.id);
    setMessage(form.id ? "Trade updated." : "Trade saved.");
  }

  function editTrade(trade: Trade) {
    setForm({
      id: trade.id,
      tradeDate: trade.tradeDate,
      description: trade.description,
      mode: trade.mode,
      startingAmount: trade.mode === "balance" ? String(trade.startingAmount) : "",
      endingAmount: trade.mode === "balance" ? String(trade.endingAmount) : "",
      entryPrice: trade.mode === "detailed" ? String(trade.entryPrice) : "",
      exitPrice: trade.mode === "detailed" ? String(trade.exitPrice) : "",
      quantity: trade.mode === "detailed" ? String(trade.quantity) : "",
      fees: trade.mode === "detailed" ? String(trade.fees) : "0",
      beforeScreenshot: trade.beforeScreenshot,
      afterScreenshot: trade.afterScreenshot,
    });
    setSelectedTradeId(trade.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function removeTrade(id: string) {
    await deleteTrade(id);
    await refreshTrades();
    setSelectedTradeId((current) => (current === id ? null : current));
    setMessage("Trade deleted.");
  }

  function exportBackup() {
    const backup = createBackupPayload(trades);
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trading-analyzer-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage("Backup exported.");
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const restored = parseBackupPayload(text);
      await replaceTrades(restored);
      await refreshTrades();
      setMessage("Backup imported.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not import backup.");
    } finally {
      event.target.value = "";
    }
  }

  async function showInstallPrompt() {
    if (!installPrompt) return;

    const prompt = installPrompt as Event & {
      prompt?: () => Promise<void>;
    };
    await prompt.prompt?.();
    setInstallPrompt(null);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Personal trading journal</p>
          <h1>Trading Analyzer</h1>
          <p>
            Log before and after screenshots, write your trade notes, and track
            profit or loss from one installable dashboard.
          </p>
        </div>
        <div className="hero-actions">
          <button type="button" className="secondary" onClick={exportBackup}>
            Export backup
          </button>
          <label className="secondary file-action">
            Import backup
            <input type="file" accept="application/json" onChange={importBackup} />
          </label>
        </div>
      </section>

      <section className="install-card">
        <div>
          <strong>Install on Android or iOS</strong>
          <p>
            Android browsers can show an install prompt. On iOS, open the share
            menu and choose Add to Home Screen.
          </p>
        </div>
        <button
          type="button"
          className="primary"
          disabled={!installPrompt}
          onClick={showInstallPrompt}
        >
          Install app
        </button>
      </section>

      <section className="summary-grid" aria-label="Trading summary">
        <SummaryCard
          label="Total P/L"
          value={formatCurrency(summary.totalProfitLoss)}
          result={getDayClass(summary.totalProfitLoss)}
        />
        <SummaryCard label="Win rate" value={formatPercent(summary.winRate)} />
        <SummaryCard label="Trades" value={String(summary.tradeCount)} />
        <SummaryCard
          label="Avg return"
          value={formatPercent(summary.averageReturnPercent)}
          result={getDayClass(summary.averageReturnPercent)}
        />
      </section>

      {message ? <div className="status-message">{message}</div> : null}

      <div className="dashboard-grid">
        <section className="panel trade-form-panel">
          <div className="section-heading">
            <h2>{form.id ? "Edit trade" : "Log a trade"}</h2>
            {form.id ? (
              <button type="button" className="ghost" onClick={() => setForm(emptyForm())}>
                Cancel
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="trade-form">
            <label>
              Trade date
              <input
                type="date"
                value={form.tradeDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    tradeDate: event.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              Trade notes
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="What setup did you take? What happened after entry?"
                required
              />
            </label>

            <div className="segmented">
              <button
                type="button"
                className={form.mode === "balance" ? "active" : ""}
                onClick={() => setForm((current) => ({ ...current, mode: "balance" }))}
              >
                Balance
              </button>
              <button
                type="button"
                className={form.mode === "detailed" ? "active" : ""}
                onClick={() => setForm((current) => ({ ...current, mode: "detailed" }))}
              >
                Detailed
              </button>
            </div>

            {form.mode === "balance" ? (
              <div className="field-grid">
                <MoneyInput
                  label="Starting amount"
                  value={form.startingAmount}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, startingAmount: value }))
                  }
                />
                <MoneyInput
                  label="Ending amount"
                  value={form.endingAmount}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, endingAmount: value }))
                  }
                />
              </div>
            ) : (
              <div className="field-grid">
                <MoneyInput
                  label="Entry price"
                  value={form.entryPrice}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, entryPrice: value }))
                  }
                />
                <MoneyInput
                  label="Exit price"
                  value={form.exitPrice}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, exitPrice: value }))
                  }
                />
                <MoneyInput
                  label="Quantity"
                  value={form.quantity}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, quantity: value }))
                  }
                />
                <MoneyInput
                  label="Fees"
                  value={form.fees}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, fees: value }))
                  }
                />
              </div>
            )}

            <div className="field-grid">
              <ScreenshotInput
                label="Before screenshot"
                asset={form.beforeScreenshot}
                onChange={(event) => handleScreenshot(event, "beforeScreenshot")}
              />
              <ScreenshotInput
                label="After screenshot"
                asset={form.afterScreenshot}
                onChange={(event) => handleScreenshot(event, "afterScreenshot")}
              />
            </div>

            <button type="submit" className="primary full-width">
              {form.id ? "Update trade" : "Save trade"}
            </button>
          </form>
        </section>

        <section className="panel">
          <div className="section-heading">
            <h2>Performance calendar</h2>
            <span>{calendarDays.length} active days</span>
          </div>
          {calendarDays.length ? (
            <div className="calendar-grid">
              {calendarDays.map((day) => (
                <div key={day.date} className={`calendar-day ${getDayClass(day.total)}`}>
                  <span>{day.date}</span>
                  <strong>{formatCurrency(day.total)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Logged trading days will appear here." />
          )}
        </section>
      </div>

      <div className="trade-workspace">
        <section className="panel trade-history-panel">
          <div className="section-heading">
            <h2>Trade history</h2>
            <span>{isLoading ? "Loading..." : `${trades.length} saved`}</span>
          </div>

          {trades.length ? (
            <div className="trade-list">
              {trades.map((trade) => (
                <article
                  key={trade.id}
                  className={`trade-card trade-list-item ${trade.result} ${
                    selectedTradeId === trade.id ? "selected" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="trade-card-button"
                    onClick={() => setSelectedTradeId(trade.id)}
                    aria-label={`Open trade from ${trade.tradeDate}`}
                  >
                    <div className="trade-main">
                      <div>
                        <p className="trade-date">{trade.tradeDate}</p>
                        <h3>{trade.description}</h3>
                      </div>
                      <div className="trade-result">
                        <strong>{formatCurrency(trade.profitLoss)}</strong>
                        <span>{formatPercent(trade.profitLossPercent)}</span>
                      </div>
                    </div>
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState text="Add your first trade to start building your summary." />
          )}
        </section>

        <section className="panel trade-detail-panel">
          {selectedTrade ? (
            <>
              <div className="section-heading">
                <div>
                  <h2>Trade details</h2>
                  <span>{selectedTrade.tradeDate}</span>
                </div>
                <button type="button" className="ghost" onClick={() => setSelectedTradeId(null)}>
                  Back
                </button>
              </div>

              <article className={`trade-detail ${selectedTrade.result}`}>
                <div className="trade-main">
                  <div>
                    <p className="trade-date">{selectedTrade.mode} trade</p>
                    <h3>{selectedTrade.description}</h3>
                  </div>
                  <div className="trade-result">
                    <strong>{formatCurrency(selectedTrade.profitLoss)}</strong>
                    <span>{formatPercent(selectedTrade.profitLossPercent)}</span>
                  </div>
                </div>

                <div className="detail-grid">
                  {selectedTrade.mode === "balance" ? (
                    <>
                      <DetailMetric
                        label="Starting amount"
                        value={formatCurrency(selectedTrade.startingAmount)}
                      />
                      <DetailMetric
                        label="Ending amount"
                        value={formatCurrency(selectedTrade.endingAmount)}
                      />
                    </>
                  ) : (
                    <>
                      <DetailMetric
                        label="Entry price"
                        value={formatCurrency(selectedTrade.entryPrice)}
                      />
                      <DetailMetric
                        label="Exit price"
                        value={formatCurrency(selectedTrade.exitPrice)}
                      />
                      <DetailMetric label="Quantity" value={String(selectedTrade.quantity)} />
                      <DetailMetric label="Fees" value={formatCurrency(selectedTrade.fees)} />
                    </>
                  )}
                </div>

                <div className="screenshot-row detail-screenshots">
                  <ScreenshotPreview label="Before" asset={selectedTrade.beforeScreenshot} />
                  <ScreenshotPreview label="After" asset={selectedTrade.afterScreenshot} />
                </div>

                <div className="trade-actions">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => editTrade(selectedTrade)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => removeTrade(selectedTrade.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            </>
          ) : (
            <>
              <div className="section-heading">
                <h2>Trade details</h2>
              </div>
              <EmptyState text="Select a trade from the history to view screenshots and full details." />
            </>
          )}
        </section>
      </div>
    </main>
  );
}

function DetailMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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

function MoneyInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        step="0.01"
        min="0"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      />
    </label>
  );
}

function ScreenshotInput({
  label,
  asset,
  onChange,
}: {
  label: string;
  asset: ScreenshotAsset | null;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="screenshot-input">
      {label}
      <input type="file" accept="image/*" onChange={onChange} />
      {asset ? <img src={asset.dataUrl} alt={`${label} preview`} /> : <span>No image</span>}
    </label>
  );
}

function ScreenshotPreview({
  label,
  asset,
}: {
  label: string;
  asset: ScreenshotAsset | null;
}) {
  return (
    <div className="screenshot-preview">
      <span>{label}</span>
      {asset ? <img src={asset.dataUrl} alt={`${label} trade screenshot`} /> : <em>No image</em>}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="empty-state">{text}</div>;
}
