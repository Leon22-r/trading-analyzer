"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTrades } from "@/hooks/useTrades";
import { SummaryGrid } from "@/components/SummaryGrid";
import { PerformanceCalendar } from "@/components/PerformanceCalendar";
import { TradeForm } from "@/components/TradeForm";
import { TradeList } from "@/components/TradeList";
import { TradeDetail } from "@/components/TradeDetail";
import { ToastStack, type ToastItem } from "@/components/ui/Toast";
import { PnLChart, type EquityPoint } from "@/components/PnLChart";
import { summarizeTrades, roundMoney } from "@/lib/tradeMath";
import type { Trade } from "@/lib/tradeTypes";

function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

export default function Home() {
  const { trades, isLoading, saveTrade, deleteTrade, importBackup, exportBackup } =
    useTrades();

  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsStandalone(mq.matches);
    const onMqChange = (e: MediaQueryListEvent) => setIsStandalone(e.matches);
    mq.addEventListener("change", onMqChange);

    registerServiceWorker();
    const handle = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handle);
    return () => {
      mq.removeEventListener("change", onMqChange);
      window.removeEventListener("beforeinstallprompt", handle);
    };
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastItem["type"] = "success") => {
      setToasts((prev) => [...prev, { id: crypto.randomUUID(), message, type }]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const summary = useMemo(() => summarizeTrades(trades), [trades]);

  const equityPoints = useMemo((): EquityPoint[] => {
    const sorted = [...trades].sort((a, b) =>
      a.tradeDate.localeCompare(b.tradeDate),
    );
    let cumulative = 0;
    return sorted.map((t) => {
      cumulative = roundMoney(cumulative + t.profitLoss);
      return { date: t.tradeDate, value: cumulative };
    });
  }, [trades]);

  const selectedTrade = trades.find((t) => t.id === selectedTradeId) ?? null;
  const editingTrade = trades.find((t) => t.id === editingTradeId) ?? null;

  async function handleSaveTrade(trade: Trade) {
    try {
      await saveTrade(trade);
      setSelectedTradeId(trade.id);
      setEditingTradeId(null);
      addToast(editingTradeId ? "Trade updated." : "Trade saved.");
    } catch {
      addToast("Could not save trade.", "error");
    }
  }

  async function handleDeleteTrade(id: string) {
    try {
      await deleteTrade(id);
      setSelectedTradeId((cur) => (cur === id ? null : cur));
      addToast("Trade deleted.");
    } catch {
      addToast("Could not delete trade.", "error");
    }
  }

  async function handleImportBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importBackup(file);
      addToast("Backup imported.");
    } catch (err) {
      addToast(
        err instanceof Error ? err.message : "Could not import backup.",
        "error",
      );
    } finally {
      event.target.value = "";
    }
  }

  function handleExportBackup() {
    exportBackup();
    addToast("Backup exported.");
  }

  async function showInstallPrompt() {
    if (!installPrompt) return;
    const p = installPrompt as Event & { prompt?: () => Promise<void> };
    await p.prompt?.();
    setInstallPrompt(null);
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Personal trading journal</p>
          <h1>Trading Analyzer</h1>
          <p>Log trades, track P&amp;L, and review your performance.</p>
        </div>
        <div className="hero-actions">
          <button type="button" className="secondary" onClick={handleExportBackup}>
            Export backup
          </button>
          <label className="secondary file-action">
            Import backup
            <input
              type="file"
              accept="application/json"
              onChange={handleImportBackup}
            />
          </label>
        </div>
      </section>

      {!isStandalone && <section className="install-card">
        <div>
          <strong>Install on Android or iOS</strong>
          <p>
            Android browsers show an install prompt. On iOS, open share and choose
            Add to Home Screen.
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
      </section>}

      <SummaryGrid summary={summary} />
      <PnLChart equityPoints={equityPoints} />

      <div className="dashboard-grid">
        <TradeForm
          editingTrade={editingTrade}
          onSave={handleSaveTrade}
          onCancelEdit={() => setEditingTradeId(null)}
        />
        <PerformanceCalendar trades={trades} />
      </div>

      <div className="trade-workspace">
        <TradeList
          trades={trades}
          isLoading={isLoading}
          selectedTradeId={selectedTradeId}
          onSelect={setSelectedTradeId}
        />
        <TradeDetail
          trade={selectedTrade}
          onEdit={(t) => {
            setEditingTradeId(t.id);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onDelete={handleDeleteTrade}
          onClose={() => setSelectedTradeId(null)}
        />
      </div>

      <ToastStack toasts={toasts} onRemove={removeToast} />
    </main>
  );
}
