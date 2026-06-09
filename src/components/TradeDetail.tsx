"use client";
import { useState } from "react";
import type { Trade } from "@/lib/tradeTypes";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ScreenshotPreview } from "@/components/ui/ScreenshotPreview";
import { EmptyState } from "@/components/ui/EmptyState";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

type Props = {
  trade: Trade | null;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => Promise<void>;
  onClose: () => void;
};

export function TradeDetail({ trade, onEdit, onDelete, onClose }: Props) {
  const [pendingDelete, setPendingDelete] = useState(false);

  async function handleConfirmDelete() {
    if (!trade) return;
    await onDelete(trade.id);
    setPendingDelete(false);
  }

  return (
    <>
      <div
        className={`trade-detail-backdrop${trade ? " visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <section className={`panel trade-detail-panel${trade ? " open" : ""}`}>
        <div className="sheet-handle" aria-hidden="true" />

        {trade ? (
          <>
            <div className="section-heading">
              <div>
                <h2>Trade details</h2>
                <span>{trade.tradeDate}</span>
              </div>
              <button type="button" className="ghost" onClick={onClose}>
                Back
              </button>
            </div>

            <article className={`trade-detail ${trade.result}`}>
              <div className="trade-main">
                <div>
                  <p className="trade-date">{trade.mode} trade</p>
                  <h3>{trade.description}</h3>
                </div>
                <div className="trade-result">
                  <strong>{currency.format(trade.profitLoss)}</strong>
                  <span>{trade.profitLossPercent.toFixed(2)}%</span>
                </div>
              </div>

              <div className="detail-grid">
                {trade.mode === "balance" ? (
                  <>
                    <DetailMetric
                      label="Starting amount"
                      value={currency.format(trade.startingAmount)}
                    />
                    <DetailMetric
                      label="Ending amount"
                      value={currency.format(trade.endingAmount)}
                    />
                  </>
                ) : (
                  <>
                    <DetailMetric
                      label="Entry price"
                      value={currency.format(trade.entryPrice)}
                    />
                    <DetailMetric
                      label="Exit price"
                      value={currency.format(trade.exitPrice)}
                    />
                    <DetailMetric label="Quantity" value={String(trade.quantity)} />
                    <DetailMetric label="Fees" value={currency.format(trade.fees)} />
                  </>
                )}
              </div>

              <div className="screenshot-row detail-screenshots">
                <ScreenshotPreview label="Before" asset={trade.beforeScreenshot} />
                <ScreenshotPreview label="After" asset={trade.afterScreenshot} />
              </div>

              <div className="trade-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => onEdit(trade)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => setPendingDelete(true)}
                >
                  Delete
                </button>
              </div>
            </article>

            {pendingDelete && (
              <ConfirmDialog
                message="Delete this trade? This cannot be undone."
                onConfirm={handleConfirmDelete}
                onCancel={() => setPendingDelete(false)}
              />
            )}
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
    </>
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
