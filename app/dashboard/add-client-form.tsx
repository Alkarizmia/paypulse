"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Client } from "./types";

type AddClientFormProps = {
  onAdd: (client: Omit<Client, "id"> & { targetWorkspaceId?: string }) => Promise<void>;
  disabled?: boolean;
  /** True quand les vraies clés Supabase sont détectées (affichage du libellé). */
  supabaseActive?: boolean;
  /** Plan Free : 5 factures max atteintes — bloque l’ajout. */
  freeInvoiceLimitReached?: boolean;
  /** Nombre de clients distincts (e-mails) actuels — pour message plan Free. */
  freeClientDistinctCount?: number;
  /** Max clients distincts en Free (affichage seulement). */
  freeClientMax?: number;
  locale?: "fr" | "en";
  /** Agency : choix du portefeuille pour ce nouveau client (sans changer le portefeuille actif du dashboard). */
  portfolioOptions?: { id: string; name: string }[];
  portfolioWorkspaceId?: string | null;
  onPortfolioChange?: (workspaceId: string) => void;
  labels?: {
    title: string;
    subtitle: string;
    portfolio?: string;
    name: string;
    company: string;
    email: string;
    amount: string;
    dueDate: string;
    status: string;
    paid: string;
    unpaid: string;
    submit: string;
    saving: string;
  };
};

export function AddClientForm({
  onAdd,
  disabled,
  supabaseActive,
  freeInvoiceLimitReached,
  freeClientDistinctCount,
  freeClientMax,
  locale = "fr",
  portfolioOptions,
  portfolioWorkspaceId,
  onPortfolioChange,
  labels,
}: AddClientFormProps) {
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [amountDue, setAmountDue] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState<Client["status"]>("unpaid");
  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setValidationError(null);
    const amount = Number.parseFloat(amountDue.replace(",", "."));
    if (!name.trim() || !email.trim() || !dueDate || Number.isNaN(amount) || amount < 0) {
      setValidationError("Veuillez renseigner un nom, un email, une date valide et un montant positif.");
      return;
    }
    setSubmitting(true);
    try {
      const pid =
        portfolioOptions && portfolioOptions.length > 0
          ? portfolioWorkspaceId && portfolioOptions.some((o) => o.id === portfolioWorkspaceId)
            ? portfolioWorkspaceId
            : portfolioOptions[0].id
          : undefined;
      await onAdd({
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        email: email.trim(),
        amountDue: amount,
        dueDate,
        status,
        ...(pid ? { targetWorkspaceId: pid } : {}),
      });
      setName("");
      setCompanyName("");
      setEmail("");
      setAmountDue("");
      setDueDate("");
      setStatus("unpaid");
    } catch {
      // Erreurs gérées par le parent (addError / limite Free)
    } finally {
      setSubmitting(false);
    }
  }

  const blocked = Boolean(disabled || submitting || freeInvoiceLimitReached);

  return (
    <section className="pp-dashboard-card-interactive rounded-2xl border border-white/[0.08] bg-[#14141c] p-4 sm:p-8 shadow-[0_0_30px_-16px_rgba(139,92,246,0.2)] hover:border-violet-500/25">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            {labels?.title ?? "Nouveau client"}
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            {labels?.subtitle ??
              `Nom, email, montant dû et date d'échéance — ${
                supabaseActive ? "enregistré dans Supabase" : "enregistré dans ce navigateur (mode local)"
              }.`}
          </p>
        </div>
      </div>

      {freeInvoiceLimitReached ? (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
          <strong className="font-semibold">
            {locale === "fr" ? "Plan Free :" : "Free plan:"}
          </strong>{" "}
          {locale === "fr" ? "nombre maximum de factures atteint." : "maximum number of invoices reached."}{" "}
          <Link href="/#pricing" className="font-semibold text-violet-300 underline underline-offset-2 hover:text-violet-200">
            {locale === "fr" ? "Voir les offres" : "View plans"}
          </Link>
        </div>
      ) : null}
      {typeof freeClientDistinctCount === "number" && typeof freeClientMax === "number" ? (
        <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-xs text-slate-400">
          {locale === "fr" ? "Clients distincts (e-mail) :" : "Distinct clients (email):"}{" "}
          <span className="font-semibold tabular-nums text-slate-200">
            {freeClientDistinctCount}/{freeClientMax}
          </span>
          {freeClientDistinctCount >= freeClientMax ? (
            <span className="block pt-1 text-amber-200/90">
              {locale === "fr"
                ? "Nouveau client = même e-mail qu’une fiche existante, ou passez Starter+ pour des e-mails illimités."
                : "New row must use an email already on file, or upgrade to Starter+ for unlimited contacts."}
            </span>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 sm:mt-6">
        <fieldset disabled={blocked} className="min-w-0">
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
            {portfolioOptions && portfolioOptions.length > 0 ? (
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {labels?.portfolio ?? (locale === "fr" ? "Portefeuille" : "Wallet")}
                </span>
                <select
                  value={
                    portfolioWorkspaceId && portfolioOptions.some((o) => o.id === portfolioWorkspaceId)
                      ? portfolioWorkspaceId
                      : portfolioOptions[0].id
                  }
                  onChange={(e) => onPortfolioChange?.(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 sm:px-4 py-2 text-sm sm:text-base text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:bg-slate-900 dark:focus:ring-sky-500/20"
                >
                  {portfolioOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {labels?.name ?? "Nom"}
              </span>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 sm:px-4 py-2 text-sm sm:text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:bg-slate-900 dark:focus:ring-sky-500/20"
                placeholder="Ex. Agence Dupont"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {labels?.company ?? "Entreprise (optionnel)"}
              </span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 sm:px-4 py-2 text-sm sm:text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:bg-slate-900 dark:focus:ring-sky-500/20"
                placeholder="Ex. Dupont Studio"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {labels?.email ?? "Email"}
              </span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 sm:px-4 py-2 text-sm sm:text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:bg-slate-900 dark:focus:ring-sky-500/20"
                placeholder="contact@exemple.fr"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {labels?.amount ?? "Montant dû (€)"}
              </span>
              <input
                required
                type="text"
                inputMode="decimal"
                value={amountDue}
                onChange={(e) => setAmountDue(e.target.value)}
                pattern="^\d+([.,]\d{1,2})?$"
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 sm:px-4 py-2 text-sm sm:text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:bg-slate-900 dark:focus:ring-sky-500/20"
                placeholder="1200"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {labels?.dueDate ?? "Date d'échéance"}
              </span>
              <input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 sm:px-4 py-2 text-sm sm:text-base text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:bg-slate-900 dark:focus:ring-sky-500/20"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {labels?.status ?? "Statut"}
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Client["status"])}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 sm:px-4 py-2 text-sm sm:text-base text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:bg-slate-900 dark:focus:ring-sky-500/20"
              >
                <option value="unpaid">{labels?.unpaid ?? "Impayé"}</option>
                <option value="paid">{labels?.paid ?? "Payé"}</option>
              </select>
            </label>
          </div>
          {validationError && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {validationError}
            </p>
          )}
          <div className="mt-6 sm:mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:pt-6 dark:border-slate-800 sm:flex-row sm:justify-end">
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-900/40 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? (labels?.saving ?? "Enregistrement…") : (labels?.submit ?? "Ajouter le client")}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
