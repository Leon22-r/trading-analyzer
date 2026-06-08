import type { Trade } from "./tradeTypes";

export function createBackupPayload(trades: Trade[]): {
  schemaVersion: 1;
  exportedAt: string;
  app: "trading-analyzer";
  trades: Trade[];
};

export function parseBackupPayload(rawText: string): Trade[];
