"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { Client } from "./types";

type AddClientFormProps = {
  appearance: UiResolvedAppearance;
  onAdd: (client: Omit<Client, "id"> & { targetWorkspaceId?: string }) => Promise<void>;
  disabled?: boolean;
  /** True quand les vraies clés Supabase sont détectées (affichage du libellé). */
  supabaseActive?: boolean;
  /** Plan Free : 5 factures max atteintes, bloque l’ajout. */
  freeInvoiceLimitReached?: boolean;
  /** Nombre de clients distincts (e-mails) actuels, pour message plan Free. */
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
  appearance,
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
  const light = appearance === "light";
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

  const fieldCls = light
    ? "mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 sm:px-4 sm:text-base"
    : "mt-1.5 w-full rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-500/55 focus:bg-black/45 focus:ring-2 focus:ring-violet-500/25 sm:px-4 sm:text-base";
  const labelSpan = light ? "text-xs font-semibold uppercase tracking-wide text-slate-500" : "text-xs font-semibold uppercase tracking-wide text-slate-400";

  return (
    <section
      className={`pp-dashboard-card-interactive min-w-0 rounded-2xl border p-4 sm:p-8 ${
        light
          ? "border-slate-200 bg-white shadow-sm hover:border-violet-300/60"
          : "border-white/[0.08] bg-[#14141c] shadow-none hover:border-violet-500/35"
      }`}
    >
      <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className={`text-lg font-bold tracking-tight ${light ? "text-slate-900" : "text-white"}`}>
            {labels?.title ?? "Nouveau client"}
          </h2>
          <p className={`mt-1 break-words text-xs sm:text-sm ${light ? "text-slate-600" : "text-slate-400"}`}>
            {labels?.subtitle ??
              `Nom, email, montant dû et date d'échéance, ${
                supabaseActive ? "enregistré dans Supabase" : "enregistré dans ce navigateur (mode local)"
              }.`}
          </p>
        </div>
      </div>

      {freeInvoiceLimitReached ? (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            light ? "border-amber-200 bg-amber-50 text-amber-900" : "border-amber-500/35 bg-amber-950/30 text-amber-100"
          }`}
        >
          <strong className="font-semibold">
            {locale === "fr" ? "Plan Free :" : "Free plan:"}
          </strong>{" "}
          {locale === "fr" ? "nombre maximum de factures atteint." : "maximum number of invoices reached."}{" "}
          <Link
            href="/#pricing"
            className={`font-semibold underline underline-offset-2 ${light ? "text-violet-700 hover:text-violet-600" : "text-violet-300 hover:text-violet-200"}`}
          >
            {locale === "fr" ? "Voir les offres" : "View plans"}
          </Link>
        </div>
      ) : null}
      {typeof freeClientDistinctCount === "number" && typeof freeClientMax === "number" ? (
        <div
          className={`mt-3 rounded-xl border px-4 py-2 text-xs ${
            light ? "border-slate-200 bg-slate-50 text-slate-600" : "border-white/10 bg-black/25 text-slate-300"
          }`}
        >
          {locale === "fr" ? "Clients distincts (e-mail) :" : "Distinct clients (email):"}{" "}
          <span className={`font-semibold tabular-nums ${light ? "text-slate-900" : "text-white"}`}>
            {freeClientDistinctCount}/{freeClientMax}
          </span>
          {freeClientDistinctCount >= freeClientMax ? (
            <span className={`block pt-1 ${light ? "text-amber-700" : "text-amber-300/95"}`}>
              {locale === "fr"
                ? "Nouveau client = même e-mail qu’une fiche existante, ou passez Starter+ pour des e-mails illimités."
                : "New row must use an email already on file, or upgrade to Starter+ for unlimited contacts."}
            </span>
          ) : null}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-5 min-w-0 sm:mt-6">
        <fieldset disabled={blocked} className="min-w-0">
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
            {portfolioOptions && portfolioOptions.length > 0 ? (
              <label className="block sm:col-span-2">
                <span className={labelSpan}>{labels?.portfolio ?? (locale === "fr" ? "Portefeuille" : "Wallet")}</span>
                <select
                  value={
                    portfolioWorkspaceId && portfolioOptions.some((o) => o.id === portfolioWorkspaceId)
                      ? portfolioWorkspaceId
                      : portfolioOptions[0].id
                  }
                  onChange={(e) => onPortfolioChange?.(e.target.value)}
                  className={fieldCls}
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
              <span className={labelSpan}>{labels?.name ?? "Nom"}</span>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={fieldCls}
                placeholder="Ex. Agence Dupont"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelSpan}>{labels?.company ?? "Entreprise (optionnel)"}</span>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className={fieldCls}
                placeholder="Ex. Dupont Studio"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelSpan}>{labels?.email ?? "Email"}</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={fieldCls}
                placeholder="contact@exemple.fr"
              />
            </label>
            <label className="block">
              <span className={labelSpan}>{labels?.amount ?? "Montant dû (€)"}</span>
              <input
                required
                type="text"
                inputMode="decimal"
                value={amountDue}
                onChange={(e) => setAmountDue(e.target.value)}
                pattern="^\d+([.,]\d{1,2})?$"
                className={fieldCls}
                placeholder="1200"
              />
            </label>
            <label className="block">
              <span className={labelSpan}>{labels?.dueDate ?? "Date d'échéance"}</span>
              <input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={fieldCls}
              />
            </label>
            <label className="block">
              <span className={labelSpan}>{labels?.status ?? "Statut"}</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Client["status"])}
                className={fieldCls}
              >
                <option value="unpaid">{labels?.unpaid ?? "Impayé"}</option>
                <option value="paid">{labels?.paid ?? "Payé"}</option>
              </select>
            </label>
          </div>
          {validationError && (
            <p
              className={`mt-4 rounded-xl border px-4 py-2 text-sm ${
                light ? "border-red-200 bg-red-50 text-red-700" : "border-red-500/40 bg-red-950/35 text-red-200"
              }`}
            >
              {validationError}
            </p>
          )}
          <div
            className={`mt-6 flex flex-col-reverse gap-3 border-t pt-4 sm:mt-8 sm:flex-row sm:justify-end sm:pt-6 ${
              light ? "border-slate-100" : "border-white/10"
            }`}
          >
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
