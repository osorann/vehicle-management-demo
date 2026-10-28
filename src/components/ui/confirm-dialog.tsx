"use client";

import { useEffect, useRef } from "react";
import { Button } from "./button";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "削除する",
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
      >
        <h2 id="confirm-title" className="text-base font-semibold text-slate-900">
          {title}
        </h2>
        <p id="confirm-message" className="mt-2 text-sm text-slate-600">
          {message}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button ref={cancelRef} variant="secondary" onClick={onCancel} disabled={busy}>
            キャンセル
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? "処理中…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
