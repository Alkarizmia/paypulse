"use client";

import { useMemo, type CSSProperties } from "react";
import type { Client } from "./types";
import { averagePaymentDelayDays, eachRecognizedPayment } from "@/lib/dashboard-metrics";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { AppLocale } from "@/lib/app-locale";
import { useMoney } from "@/app/display-currency-context";
import { getDashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";

function calendarMonthPaidTotal(clients: Client[], year: number, month: number): number {
  let sum = 0;
  for (const c of clients) {
    for (const { at, amount } of eachRecognizedPayment(c)) {
      if (at.getFullYear() === year && at.getMonth() === month) sum += amount;
    }
  }
  return sum;
}

type DashboardHomeKpiProps = {
  clients: Client[];
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  remindersSentCount: number;
  onAddClient: () => void;
  onReminders: () => void;
};

export function DashboardHomeKpi({
  clients,
  locale,
  appearance,
  remindersSentCount,
  onAddClient,
  onReminders,
}: DashboardHomeKpiProps) {
  const light = appearance === "light";
  const t = getDashboardHomeCopy(locale);
  const money = useMoney();
  const emptyAccount = clients.length === 0;

  const unpaidTotal = useMemo(
    () => clients.filter((c) => c.status === "unpaid").reduce((s, c) => s + c.amountDue, 0),
    [clients],
  );

  const receivedThisMonth = useMemo(() => {
    const now = new Date();
    return calendarMonthPaidTotal(clients, now.getFullYear(), now.getMonth());
  }, [clients]);

  const avgDelay = useMemo(() => averagePaymentDelayDays(clients), [clients]);

  const card = (accent: "danger" | "success" | "warning" | "accent") => {
    const bar = {
      danger: "border-l-[3px] border-l-danger",
      success: "border-l-[3px] border-l-success",
      warning: "border-l-[3px] border-l-warning",
      accent: "border-l-[3px] border-l-accent",
    };
    return `pp-rise pp-dashboard-card-interactive rounded-2xl border p-4 sm:p-5 ${bar[accent]} ${
      light ? "border-border bg-bg shadow-sm" : "border-white/[0.08] bg-bg-dark"
    }`;
  };

  const emptyAction = (onClick: () => void, label: string) => (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 text-left text-sm font-medium text-accent underline-offset-2 hover:underline"
    >
      {label}
    </button>
  );

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
      <div className={card("danger")} style={{ "--pp-rise-delay": "0.04s" } as CSSProperties}>
        <p className={`text-xs font-medium uppercase tracking-wide ${light ? "text-slate-600" : "text-slate-400"}`}>
          {t.kpiUnpaid}
        </p>
        {emptyAccount ? (
          emptyAction(onAddClient, t.kpiEmptyCta)
        ) : (
          <p className={`mt-2 text-xl font-semibold tabular-nums sm:text-2xl ${light ? "text-slate-900" : "text-white"}`}>
            {money.format(unpaidTotal)}
          </p>
        )}
      </div>
      <div className={card("success")} style={{ "--pp-rise-delay": "0.08s" } as CSSProperties}>
        <p className={`text-xs font-medium uppercase tracking-wide ${light ? "text-slate-600" : "text-slate-400"}`}>
          {t.kpiReceivedMonth}
        </p>
        {emptyAccount ? (
          emptyAction(onAddClient, t.kpiEmptyCta)
        ) : (
          <p className={`mt-2 text-xl font-semibold tabular-nums sm:text-2xl ${light ? "text-slate-900" : "text-white"}`}>
            {money.format(receivedThisMonth)}
          </p>
        )}
      </div>
      <div className={card("warning")} style={{ "--pp-rise-delay": "0.12s" } as CSSProperties}>
        <p className={`text-xs font-medium uppercase tracking-wide ${light ? "text-slate-600" : "text-slate-400"}`}>
          {t.kpiAvgDelay}
        </p>
        {emptyAccount || avgDelay === null ? (
          emptyAccount ? (
            emptyAction(onAddClient, t.kpiEmptyCta)
          ) : (
            <p className={`mt-2 text-base font-medium ${light ? "text-slate-500" : "text-slate-400"}`}>{t.kpiNoHistory}</p>
          )
        ) : (
          <p className={`mt-2 text-xl font-semibold sm:text-2xl ${light ? "text-slate-900" : "text-white"}`}>
            {avgDelay} <span className={`text-base font-medium ${light ? "text-slate-500" : "text-slate-400"}`}>{t.kpiDays}</span>
          </p>
        )}
      </div>
      <div className={card("accent")} style={{ "--pp-rise-delay": "0.16s" } as CSSProperties}>
        <p className={`text-xs font-medium uppercase tracking-wide ${light ? "text-slate-600" : "text-slate-400"}`}>
          {t.kpiRemindersSent}
        </p>
        {emptyAccount || remindersSentCount === 0 ? (
          emptyAction(onReminders, t.kpiEmptyReminders)
        ) : (
          <p className={`mt-2 text-xl font-semibold tabular-nums sm:text-2xl ${light ? "text-slate-900" : "text-white"}`}>
            {remindersSentCount}
          </p>
        )}
      </div>
    </div>
  );
}
