import { useEffect, useState } from "react";
import type { Trade } from "@/lib/tradeTypes";
import {
  deleteTrade as storageDeleteTrade,
  getTrades,
  replaceTrades,
  saveTrade as storageSaveTrade,
} from "@/lib/storage";
import { createBackupPayload, parseBackupPayload } from "@/lib/backup";

export type UseTradesReturn = {
  trades: Trade[];
  isLoading: boolean;
  loadError: Error | null;
  saveTrade: (trade: Trade) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  importBackup: (file: File) => Promise<void>;
  exportBackup: () => void;
};

export function useTrades(): UseTradesReturn {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);

  async function refresh() {
    setTrades(await getTrades());
  }

  useEffect(() => {
    getTrades()
      .then(setTrades)
      .catch((err) => setLoadError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setIsLoading(false));
  }, []);

  async function saveTrade(trade: Trade): Promise<void> {
    await storageSaveTrade(trade);
    await refresh();
  }

  async function deleteTrade(id: string): Promise<void> {
    await storageDeleteTrade(id);
    await refresh();
  }

  async function importBackup(file: File): Promise<void> {
    const text = await file.text();
    const restored = parseBackupPayload(text);
    await replaceTrades(restored);
    await refresh();
  }

  function exportBackup(): void {
    const backup = createBackupPayload(trades);
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trading-analyzer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return { trades, isLoading, loadError, saveTrade, deleteTrade, importBackup, exportBackup };
}
