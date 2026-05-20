"use client";

import { useEffect } from "react";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { AppLocale } from "@/lib/app-locale";
import type { Client } from "./types";
import { AddClientForm } from "./add-client-form";

type AddClientModalProps = {
  open: boolean;
  appearance: UiResolvedAppearance;
  locale: AppLocale;
  onClose: () => void;
  onAdd: (client: Omit<Client, "id"> & { targetWorkspaceId?: string }) => Promise<void>;
  disabled?: boolean;
  supabaseActive?: boolean;
  freeInvoiceLimitReached?: boolean;
  freeClientDistinctCount?: number;
  freeClientMax?: number;
  portfolioOptions?: { id: string; name: string }[];
  portfolioWorkspaceId?: string | null;
  onPortfolioChange?: (workspaceId: string) => void;
  serverError?: string | null;
  labels: {
    title: string;
    subtitle: string;
    portfolio?: string;
    name: string;
    company: string;
    domain: string;
    phone: string;
    email: string;
    amount: string;
    dueDate: string;
    status: string;
    paid: string;
    unpaid: string;
    submit: string;
    saving: string;
    cancel: string;
  };
};

export function AddClientModal({
  open,
  appearance,
  locale,
  onClose,
  onAdd,
  disabled,
  supabaseActive,
  freeInvoiceLimitReached,
  freeClientDistinctCount,
  freeClientMax,
  portfolioOptions,
  portfolioWorkspaceId,
  onPortfolioChange,
  serverError,
  labels,
}: AddClientModalProps) {
  const light = appearance === "light";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="add-client-modal-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        aria-label={labels.cancel}
        onClick={onClose}
      />
      <div
        className={`relative z-[101] flex max-h-[min(92vh,720px)] w-full flex-col overflow-hidden rounded-t-2xl border shadow-2xl sm:max-w-lg sm:rounded-2xl ${
          light
            ? "border-slate-200 bg-white shadow-slate-900/15"
            : "border-white/[0.12] bg-[#16161f] shadow-black/50"
        }`}
      >
        <div className={`flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4 sm:px-6 ${light ? "border-slate-100" : "border-white/[0.06]"}`}>
          <div className="min-w-0">
            <h2 id="add-client-modal-title" className={`text-lg font-bold tracking-tight ${light ? "text-slate-900" : "text-white"}`}>
              {labels.title}
            </h2>
            <p className={`mt-1 text-xs sm:text-sm ${light ? "text-slate-600" : "text-slate-400"}`}>{labels.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
              light ? "text-slate-500 hover:bg-slate-100 hover:text-slate-800" : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
            aria-label={labels.cancel}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {serverError ? (
            <p
              className={`mb-4 rounded-xl border px-4 py-2 text-sm ${
                light ? "border-red-200 bg-red-50 text-red-700" : "border-red-500/40 bg-red-950/35 text-red-200"
              }`}
              role="alert"
            >
              {serverError}
            </p>
          ) : null}
          <AddClientForm
            variant="content"
            appearance={appearance}
            locale={locale}
            onAdd={onAdd}
            onSuccess={onClose}
            disabled={disabled}
            supabaseActive={supabaseActive}
            freeInvoiceLimitReached={freeInvoiceLimitReached}
            freeClientDistinctCount={freeClientDistinctCount}
            freeClientMax={freeClientMax}
            portfolioOptions={portfolioOptions}
            portfolioWorkspaceId={portfolioWorkspaceId}
            onPortfolioChange={onPortfolioChange}
            labels={labels}
            showCancel
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
