"use client";

import { useEffect, useState } from "react";

export type AdvanceNextCycleModalLabels = {
  title: string;
  subtitle: string;
  amount: string;
  dueDate: string;
  cancel: string;
  confirm: string;
  invalidAmount: string;
  invalidDate: string;
};

type AdvanceNextCycleModalProps = {
  open: boolean;
  clientName: string;
  defaultAmount: number;
  defaultDueDate: string;
  labels: AdvanceNextCycleModalLabels;
  onClose: () => void;
  onConfirm: (payload: { amountDue: number; dueDate: string }) => void;
};

function parseAmountInput(raw: string): number | null {
  const normalized = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (normalized === "") return null;
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function AdvanceNextCycleModal({
  open,
  clientName,
  defaultAmount,
  defaultDueDate,
  labels,
  onClose,
  onConfirm,
}: AdvanceNextCycleModalProps) {
  const [amountStr, setAmountStr] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAmountStr(String(defaultAmount));
    setDueDate(defaultDueDate);
    setFormError(null);
  }, [open, defaultAmount, defaultDueDate]);

  if (!open) return null;

  function submit() {
    const amount = parseAmountInput(amountStr);
    if (amount === null) {
      setFormError(labels.invalidAmount);
      return;
    }
    const d = dueDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      setFormError(labels.invalidDate);
      return;
    }
    setFormError(null);
    onConfirm({ amountDue: amount, dueDate: d });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="advance-cycle-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        aria-label={labels.cancel}
        onClick={onClose}
      />
      <div className="relative z-[101] w-full max-w-md rounded-2xl border border-white/[0.12] bg-[#16161f] p-6 shadow-2xl shadow-black/50">
        <h2 id="advance-cycle-title" className="text-lg font-semibold text-white">
          {labels.title}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          {labels.subtitle} <span className="font-medium text-slate-300">{clientName}</span>
        </p>
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="advance-amount" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              {labels.amount}
            </label>
            <input
              id="advance-amount"
              type="text"
              inputMode="decimal"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/[0.1] bg-[#0f0f14] px-3 py-2.5 text-sm text-white tabular-nums outline-none ring-violet-500/30 placeholder:text-slate-600 focus:border-violet-500/50 focus:ring-2"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="advance-due" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              {labels.dueDate}
            </label>
            <input
              id="advance-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/[0.1] bg-[#0f0f14] px-3 py-2.5 text-sm text-white outline-none ring-violet-500/30 focus:border-violet-500/50 focus:ring-2"
            />
          </div>
        </div>
        {formError ? <p className="mt-3 text-sm text-rose-400">{formError}</p> : null}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08]"
          >
            {labels.cancel}
          </button>
          <button
            type="button"
            onClick={() => submit()}
            className="rounded-lg border border-sky-500/40 bg-sky-600/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
          >
            {labels.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
