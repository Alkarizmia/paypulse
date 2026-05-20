"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { AppLocale } from "@/lib/app-locale";
import { useMoney } from "@/app/display-currency-context";
import { convertDisplayToEur } from "@/lib/display-currency";
import type { Client } from "./types";

type AddClientFormProps = {
  appearance: UiResolvedAppearance;
  onAdd: (client: Omit<Client, "id"> & { targetWorkspaceId?: string }) => Promise<void>;
  /** Ferme la modale ou réinitialise après succès. */
  onSuccess?: () => void;
  disabled?: boolean;
  supabaseActive?: boolean;
  freeInvoiceLimitReached?: boolean;
  freeClientDistinctCount?: number;
  freeClientMax?: number;
  locale?: AppLocale;
  portfolioOptions?: { id: string; name: string }[];
  portfolioWorkspaceId?: string | null;
  onPortfolioChange?: (workspaceId: string) => void;
  /** card = bloc pleine page ; content = corps pour modale */
  variant?: "card" | "content";
  showCancel?: boolean;
  onCancel?: () => void;
  labels?: {
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

export function AddClientForm({
  appearance,
  onAdd,
  onSuccess,
  disabled,
  supabaseActive,
  freeInvoiceLimitReached,
  freeClientDistinctCount,
  freeClientMax,
  locale = "fr",
  portfolioOptions,
  portfolioWorkspaceId,
  onPortfolioChange,
  variant = "card",
  showCancel,
  onCancel,
  labels,
}: AddClientFormProps) {
  const money = useMoney();
  const light = appearance === "light";
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [domain, setDomain] = useState("");
  const [phone, setPhone] = useState("");
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
      setValidationError(
        locale === "fr"
          ? "Veuillez renseigner un nom, un email, une date valide et un montant positif."
          : "Please enter a name, email, valid date and a positive amount.",
      );
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
        domain: domain.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim(),
        amountDue: convertDisplayToEur(amount, money.displayCurrency),
        dueDate,
        status,
        ...(pid ? { targetWorkspaceId: pid } : {}),
      });
      setName("");
      setCompanyName("");
      setDomain("");
      setPhone("");
      setEmail("");
      setAmountDue("");
      setDueDate("");
      setStatus("unpaid");
      onSuccess?.();
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

  const formBody = (
    <>
      {freeInvoiceLimitReached ? (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            light ? "border-amber-200 bg-amber-50 text-amber-900" : "border-amber-500/35 bg-amber-950/30 text-amber-100"
          }`}
        >
          <strong className="font-semibold">{locale === "fr" ? "Plan Free :" : "Free plan:"}</strong>{" "}
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
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className={variant === "card" ? "mt-5 min-w-0 sm:mt-6" : "min-w-0"}>
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
            <label className="block">
              <span className={labelSpan}>{labels?.domain ?? (locale === "fr" ? "Domaine (optionnel)" : "Domain (optional)")}</span>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className={fieldCls}
                placeholder={locale === "fr" ? "Ex. dupont.fr" : "Ex. acme.com"}
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className={labelSpan}>{labels?.phone ?? (locale === "fr" ? "Téléphone (optionnel)" : "Phone (optional)")}</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={fieldCls}
                placeholder="+32 470 00 00 00"
                autoComplete="tel"
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
              <span className={labelSpan}>
                {money.amountFieldLabel(labels?.amount ?? (locale === "fr" ? "Montant dû" : "Amount due"))}
              </span>
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
              <input required type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={fieldCls} />
            </label>
            <label className="block sm:col-span-2">
              <span className={labelSpan}>{labels?.status ?? "Statut"}</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as Client["status"])} className={fieldCls}>
                <option value="unpaid">{labels?.unpaid ?? "Impayé"}</option>
                <option value="paid">{labels?.paid ?? "Payé"}</option>
              </select>
            </label>
          </div>
          {validationError ? (
            <p
              className={`mt-4 rounded-xl border px-4 py-2 text-sm ${
                light ? "border-red-200 bg-red-50 text-red-700" : "border-red-500/40 bg-red-950/35 text-red-200"
              }`}
            >
              {validationError}
            </p>
          ) : null}
          <div
            className={`mt-6 flex flex-col-reverse gap-3 border-t pt-4 sm:mt-8 sm:flex-row sm:justify-end sm:pt-6 ${
              light ? "border-slate-100" : "border-white/10"
            }`}
          >
            {showCancel && onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting}
                className={`inline-flex w-full items-center justify-center rounded-xl border px-5 py-3 text-sm font-semibold transition sm:w-auto ${
                  light
                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]"
                }`}
              >
                {labels?.cancel ?? (locale === "fr" ? "Annuler" : "Cancel")}
              </button>
            ) : null}
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-violet-900/40 transition duration-200 hover:-translate-y-0.5 hover:bg-violet-500 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? (labels?.saving ?? "Enregistrement…") : (labels?.submit ?? "Ajouter le client")}
            </button>
          </div>
        </fieldset>
      </form>
    </>
  );

  if (variant === "content") {
    return <div className="min-w-0">{formBody}</div>;
  }

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
      {formBody}
    </section>
  );
}
