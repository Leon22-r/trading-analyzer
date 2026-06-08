import type { Trade } from "./tradeTypes";
import { sortTradesNewestFirst } from "./tradeSort";

const DB_NAME = "trading-analyzer";
const DB_VERSION = 1;
const STORE_NAME = "trades";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("tradeDate", "tradeDate");
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

export async function getTrades(): Promise<Trade[]> {
  const db = await openDatabase();

  return new Promise<Trade[]>((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .getAll();

    request.onsuccess = () => {
      resolve(sortTradesNewestFirst(request.result as Trade[]));
    };
    request.onerror = () => reject(request.error);
  }).finally(() => db.close());
}

export async function saveTrade(trade: Trade): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put(trade);
  await transactionDone(transaction);
  db.close();
}

export async function deleteTrade(id: string): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).delete(id);
  await transactionDone(transaction);
  db.close();
}

export async function replaceTrades(trades: Trade[]): Promise<void> {
  const db = await openDatabase();
  const transaction = db.transaction(STORE_NAME, "readwrite");
  const store = transaction.objectStore(STORE_NAME);

  store.clear();
  for (const trade of trades) {
    store.put(trade);
  }

  await transactionDone(transaction);
  db.close();
}
