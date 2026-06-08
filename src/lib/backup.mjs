const BACKUP_SCHEMA_VERSION = 1;

export function createBackupPayload(trades) {
  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    app: "trading-analyzer",
    trades,
  };
}

export function parseBackupPayload(rawText) {
  let payload;

  try {
    payload = JSON.parse(rawText);
  } catch {
    throw new Error("Backup file is not valid JSON.");
  }

  if (payload?.schemaVersion !== BACKUP_SCHEMA_VERSION || !Array.isArray(payload.trades)) {
    throw new Error("Unsupported backup file.");
  }

  return payload.trades;
}
