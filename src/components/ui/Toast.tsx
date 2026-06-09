"use client";
import { useEffect } from "react";

export type ToastItem = {
  id: string;
  message: string;
  type: "success" | "error";
};

function Toast({
  toast,
  onRemove,
}: {
  toast: ToastItem;
  onRemove: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      className={`toast toast-${toast.type}`}
      role="alert"
      onClick={() => onRemove(toast.id)}
    >
      {toast.message}
    </div>
  );
}

type StackProps = {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
};

export function ToastStack({ toasts, onRemove }: StackProps) {
  if (!toasts.length) return null;
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}
