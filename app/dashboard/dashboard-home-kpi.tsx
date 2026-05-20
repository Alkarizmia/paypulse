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
};

export function DashboardHomeKpi({ clients, locale, appearance, remindersSentCount }: DashboardHomeKpiProps) {
  const light = appearance === "light";
  const t = getDashboardHomeCopy(locale);
  const money = useMoney();

  const unpaidTotal = useMemo(
    () => clients.filter((c) => c.status === "unpaid").reduce((s, c) => s + c.amountDue, 0),
    [clients],
  );

  const receivedThisMonth = useMemo(() => {
    const now = new Date();
    return calendarMonthPaidTotal(clients, now.getFullYear(), now.getMonth());
  }, [clients]);

  const avgDelay = useMemo(() => averagePaymentDelayDays(clients), [clients]);

  const card = (delay: string, accent: "emerald" | "amber" | "slate" | "sky") => {
    const accents = {
      emerald: light ? "hover:border-emerald-300/60" : "hover:border-emerald-500/35",
      amber: light ? "hover:border-amber-300/60" : "hover:border-amber-500/35",
      slate: light ? "hover:border-slate-300" : "hover:border-white/12",
      sky: light ? "hover:border-sky-300/60" : "hover:border-sky-500/35",
    };
    return `pp-rise pp-dashboard-card-interactive rounded-2xl border p-4 sm:p-5 ${
      light ? `border-slate-200 bg-white shadow-sm ${accents[accent]}` : `border-white/[0.08] bg-[#14141c] ${accents[accent]}`
    }`;
  };

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
      <div className={card("0.04s", "amber")} style={{ "--pp-rise-delay": "0.04s" } as CSSProperties}>
        <p className={`text-xs font-medium uppercase tracking-wide ${light ? "text-slate-600" : "text-slate-400"}`}>
          {t.kpiUnpaid}
        </p>
        <p className={`mt-2 text-xl font-semibold tabular-nums sm:text-2xl ${light ? "text-slate-900" : "text-white"}`}>
          {money.format(unpaidTotal)}
        </p>
      </div>
      <div className={card("0.08s", "emerald")} style={{ "--pp-rise-delay": "0.08s" } as CSSProperties}>
        <p className={`text-xs font-medium uppercase tracking-wide ${light ? "text-slate-600" : "text-slate-400"}`}>
          {t.kpiReceivedMonth}
        </p>
        <p className={`mt-2 text-xl font-semibold tabular-nums sm:text-2xl ${light ? "text-slate-900" : "text-white"}`}>
          {money.format(receivedThisMonth)}
        </p>
      </div>
      <div className={card("0.12s", "slate")} style={{ "--pp-rise-delay": "0.12s" } as CSSProperties}>
        <p className={`text-xs font-medium uppercase tracking-wide ${light ? "text-slate-600" : "text-slate-400"}`}>
          {t.kpiAvgDelay}
        </p>
        <p className={`mt-2 text-xl font-semibold sm:text-2xl ${light ? "text-slate-900" : "text-white"}`}>
          {avgDelay === null ? (
            <span className={`text-base font-medium ${light ? "text-slate-500" : "text-slate-400"}`}>{t.kpiNoHistory}</span>
          ) : (
            <>
              {avgDelay}{" "}
              <span className={`text-base font-medium ${light ? "text-slate-500" : "text-slate-400"}`}>{t.kpiDays}</span>
            </>
          )}
        </p>
      </div>
      <div className={card("0.16s", "sky")} style={{ "--pp-rise-delay": "0.16s" } as CSSProperties}>
        <p className={`text-xs font-medium uppercase tracking-wide ${light ? "text-slate-600" : "text-slate-400"}`}>
          {t.kpiRemindersSent}
        </p>
        <p className={`mt-2 text-xl font-semibold tabular-nums sm:text-2xl ${light ? "text-slate-900" : "text-white"}`}>
          {remindersSentCount}
        </p>
      </div>
    </div>
  );
}
