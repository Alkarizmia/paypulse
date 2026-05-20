"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Client } from "./types";
import { bucketClientsForPipeline, daysOverdueLabel, type PipelineColumnId } from "@/lib/collection-pipeline";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import { intlLocaleFor, type AppLocale } from "@/lib/app-locale";
import { useMoney } from "@/app/display-currency-context";
import { getDashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";

type CollectionPipelineProps = {
  clients: Client[];
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  onClientClick: (client: Client) => void;
  /** preview = accueil (aperçu) ; full = page dédiée */
  variant?: "preview" | "full";
  onViewAll?: () => void;
};

function columnTitle(id: PipelineColumnId, t: ReturnType<typeof getDashboardHomeCopy>): string {
  switch (id) {
    case "to_remind":
      return t.colToRemind;
    case "reminder_sent":
      return t.colReminderSent;
    case "promised":
      return t.colPromised;
    case "paid":
      return t.colPaid;
  }
}

function columnTone(id: PipelineColumnId, light: boolean): string {
  const map = {
    to_remind: light ? "border-amber-200 bg-amber-50/80" : "border-amber-500/25 bg-amber-500/5",
    reminder_sent: light ? "border-sky-200 bg-sky-50/80" : "border-sky-500/25 bg-sky-500/5",
    promised: light ? "border-slate-200 bg-slate-50/80" : "border-white/10 bg-white/[0.03]",
    paid: light ? "border-emerald-200 bg-emerald-50/80" : "border-emerald-500/25 bg-emerald-500/5",
  };
  return map[id];
}

export function CollectionPipeline({
  clients,
  locale,
  appearance,
  onClientClick,
  variant = "full",
  onViewAll,
}: CollectionPipelineProps) {
  const light = appearance === "light";
  const t = getDashboardHomeCopy(locale);
  const isPreview = variant === "preview";
  const maxPerColumn = isPreview ? 3 : undefined;
  const money = useMoney();
  const columns = useMemo(() => bucketClientsForPipeline(clients), [clients]);

  const headerAction =
    isPreview ? (
      <Link
        href="/dashboard/pipeline"
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          light
            ? "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
        }`}
      >
        {t.pipelineViewAll}
      </Link>
    ) : onViewAll ? (
      <button
        type="button"
        onClick={onViewAll}
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
          light
            ? "border border-slate-200 text-slate-700 hover:bg-slate-50"
            : "border border-white/10 text-slate-300 hover:bg-white/[0.06]"
        }`}
      >
        {t.pipelineConfigure}
      </button>
    ) : null;

  return (
    <section
      className={`rounded-2xl border p-4 sm:p-5 ${
        light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={`${isPreview ? "text-sm" : "text-base"} font-semibold ${light ? "text-slate-900" : "text-white"}`}>
            {isPreview ? t.pipelineTitle : t.pipelinePageTitle}
          </h3>
          <p className={`mt-1 text-xs ${light ? "text-slate-600" : "text-slate-400"}`}>
            {isPreview ? t.pipelineHint : t.pipelinePageIntro}
          </p>
        </div>
        {headerAction}
      </div>

      <div className={`mt-4 grid gap-3 sm:grid-cols-2 ${isPreview ? "xl:grid-cols-4" : "lg:grid-cols-4"}`}>
        {columns.map((col) => {
          const visible = maxPerColumn ? col.clients.slice(0, maxPerColumn) : col.clients;
          const hidden = maxPerColumn ? Math.max(0, col.clients.length - maxPerColumn) : 0;
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-xl border p-2.5 ${columnTone(col.id, light)} ${
                isPreview ? "min-h-[120px]" : "min-h-[min(420px,60vh)]"
              }`}
            >
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <span className={`text-xs font-semibold uppercase tracking-wide ${light ? "text-slate-700" : "text-slate-200"}`}>
                  {columnTitle(col.id, t)}
                </span>
                <span className={`text-xs tabular-nums ${light ? "text-slate-500" : "text-slate-400"}`}>{col.clients.length}</span>
              </div>
              <ul className={`flex flex-1 flex-col gap-2 ${isPreview ? "" : "overflow-y-auto pr-0.5"}`}>
                {col.clients.length === 0 ? (
                  <li className={`px-1 py-4 text-center text-xs ${light ? "text-slate-500" : "text-slate-500"}`}>{t.colEmpty}</li>
                ) : (
                  visible.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => onClientClick(c)}
                        className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                          light
                            ? "border-slate-200/80 bg-white hover:border-emerald-300/70 hover:bg-emerald-50/50"
                            : "border-white/[0.08] bg-[#14141c] hover:border-emerald-500/40 hover:bg-emerald-500/5"
                        }`}
                      >
                        <p className={`truncate text-xs font-semibold ${light ? "text-slate-900" : "text-white"}`}>{c.name}</p>
                        {c.companyName ? (
                          <p className={`truncate text-[10px] ${light ? "text-slate-500" : "text-slate-500"}`}>{c.companyName}</p>
                        ) : null}
                        <p className={`mt-0.5 text-xs tabular-nums ${light ? "text-slate-600" : "text-slate-400"}`}>
                          {money.format(c.amountDue)}
                        </p>
                        <p className={`mt-0.5 text-[10px] font-medium ${light ? "text-slate-500" : "text-slate-500"}`}>
                          {col.id === "paid" ? t.colPaid : `${c.dueDate} · ${daysOverdueLabel(c.dueDate, intlLocaleFor(locale))}`}
                        </p>
                      </button>
                    </li>
                  ))
                )}
              </ul>
              {hidden > 0 ? (
                <Link
                  href="/dashboard/pipeline"
                  className={`mt-2 px-1 text-center text-[10px] font-semibold ${light ? "text-emerald-700" : "text-emerald-300"}`}
                >
                  +{hidden} · {t.pipelineOpenFull}
                </Link>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
