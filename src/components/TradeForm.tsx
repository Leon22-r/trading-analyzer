// src/components/TradeForm.tsx
"use client";
import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import type { ScreenshotAsset, Trade } from "@/lib/tradeTypes";
import { calculateBalanceResult, calculateDetailedResult } from "@/lib/tradeMath";
import type { CalculatedTradeResult } from "@/lib/tradeMath";
import { MoneyInput } from "@/components/ui/MoneyInput";
import { ScreenshotInput } from "@/components/ui/ScreenshotInput";

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

function emptyForm(): FormState {
  return {
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
  };
}

function num(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fileToAsset(file: File): Promise<ScreenshotAsset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, type: file.type, dataUrl: String(reader.result) });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

type Props = {
  editingTrade: Trade | null;
  onSave: (trade: Trade) => Promise<void>;
  onCancelEdit: () => void;
};

export function TradeForm({ editingTrade, onSave, onCancelEdit }: Props) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!editingTrade) {
      setForm(emptyForm());
      setValidationError("");
      return;
    }
    setValidationError("");
    setForm({
      id: editingTrade.id,
      tradeDate: editingTrade.tradeDate,
      description: editingTrade.description,
      mode: editingTrade.mode,
      startingAmount:
        editingTrade.mode === "balance" ? String(editingTrade.startingAmount) : "",
      endingAmount:
        editingTrade.mode === "balance" ? String(editingTrade.endingAmount) : "",
      entryPrice:
        editingTrade.mode === "detailed" ? String(editingTrade.entryPrice) : "",
      exitPrice:
        editingTrade.mode === "detailed" ? String(editingTrade.exitPrice) : "",
      quantity:
        editingTrade.mode === "detailed" ? String(editingTrade.quantity) : "",
      fees:
        editingTrade.mode === "detailed" ? String(editingTrade.fees) : "0",
      beforeScreenshot: editingTrade.beforeScreenshot,
      afterScreenshot: editingTrade.afterScreenshot,
    });
  }, [editingTrade]);

  async function handleScreenshot(
    event: ChangeEvent<HTMLInputElement>,
    field: "beforeScreenshot" | "afterScreenshot",
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    const asset = await fileToAsset(file);
    setForm((c) => ({ ...c, [field]: asset }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    if (form.mode === "detailed") {
      if (num(form.entryPrice) === 0 || num(form.exitPrice) === 0 || num(form.quantity) === 0) {
        setValidationError("Entry price, exit price, and quantity must all be non-zero.");
        return;
      }
    } else {
      if (num(form.startingAmount) === 0 && num(form.endingAmount) === 0) {
        setValidationError("Starting and ending amount cannot both be zero.");
        return;
      }
    }

    const now = new Date().toISOString();
    const calculated: CalculatedTradeResult =
      form.mode === "balance"
        ? calculateBalanceResult(num(form.startingAmount), num(form.endingAmount))
        : calculateDetailedResult({
            entryPrice: num(form.entryPrice),
            exitPrice: num(form.exitPrice),
            quantity: num(form.quantity),
            fees: num(form.fees),
          });

    const base = {
      id: form.id ?? crypto.randomUUID(),
      createdAt: form.id ? (editingTrade?.createdAt ?? now) : now,
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
            startingAmount: num(form.startingAmount),
            endingAmount: num(form.endingAmount),
          }
        : {
            ...base,
            mode: "detailed",
            entryPrice: num(form.entryPrice),
            exitPrice: num(form.exitPrice),
            quantity: num(form.quantity),
            fees: num(form.fees),
          };

    await onSave(trade);
    setForm(emptyForm());
  }

  return (
    <section className="panel trade-form-panel">
      <div className="section-heading">
        <h2>{form.id ? "Edit trade" : "Log a trade"}</h2>
        {form.id ? (
          <button type="button" className="ghost" onClick={onCancelEdit}>
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
            onChange={(e) => setForm((c) => ({ ...c, tradeDate: e.target.value }))}
            required
          />
        </label>

        <label>
          Trade notes
          <textarea
            value={form.description}
            onChange={(e) => setForm((c) => ({ ...c, description: e.target.value }))}
            placeholder="What setup did you take? What happened after entry?"
            required
          />
        </label>

        <div className="segmented">
          <button
            type="button"
            className={form.mode === "balance" ? "active" : ""}
            onClick={() => setForm((c) => ({ ...c, mode: "balance" }))}
          >
            Balance
          </button>
          <button
            type="button"
            className={form.mode === "detailed" ? "active" : ""}
            onClick={() => setForm((c) => ({ ...c, mode: "detailed" }))}
          >
            Detailed
          </button>
        </div>

        {form.mode === "balance" ? (
          <div className="field-grid">
            <MoneyInput
              label="Starting amount"
              value={form.startingAmount}
              onChange={(v) => setForm((c) => ({ ...c, startingAmount: v }))}
            />
            <MoneyInput
              label="Ending amount"
              value={form.endingAmount}
              onChange={(v) => setForm((c) => ({ ...c, endingAmount: v }))}
            />
          </div>
        ) : (
          <div className="field-grid">
            <MoneyInput
              label="Entry price"
              value={form.entryPrice}
              onChange={(v) => setForm((c) => ({ ...c, entryPrice: v }))}
            />
            <MoneyInput
              label="Exit price"
              value={form.exitPrice}
              onChange={(v) => setForm((c) => ({ ...c, exitPrice: v }))}
            />
            <MoneyInput
              label="Quantity"
              value={form.quantity}
              onChange={(v) => setForm((c) => ({ ...c, quantity: v }))}
            />
            <MoneyInput
              label="Fees"
              value={form.fees}
              onChange={(v) => setForm((c) => ({ ...c, fees: v }))}
            />
          </div>
        )}

        {validationError ? (
          <p className="validation-error">{validationError}</p>
        ) : null}

        <div className="field-grid">
          <ScreenshotInput
            label="Before screenshot"
            asset={form.beforeScreenshot}
            onChange={(e) => handleScreenshot(e, "beforeScreenshot")}
          />
          <ScreenshotInput
            label="After screenshot"
            asset={form.afterScreenshot}
            onChange={(e) => handleScreenshot(e, "afterScreenshot")}
          />
        </div>

        <button type="submit" className="primary full-width">
          {form.id ? "Update trade" : "Save trade"}
        </button>
      </form>
    </section>
  );
}
