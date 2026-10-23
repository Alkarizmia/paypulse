"use client";

import { useMemo, type CSSProperties } from "react";
import type { Client } from "./types";
import {
  averagePaymentDelayDays,
  eachRecognizedPayment,
  unpaidDueBucket,
} from "@/lib/dashboard-metrics";
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
  remindersSentThisMonth: number;
  onAddClient: () => void;
  onSendOverdueReminders: () => void;
  invoiceActionsDisabled?: boolean;
};

export function DashboardHomeKpi({
  clients,
  locale,
  appearance,
  remindersSentThisMonth,
  onAddClient,
  onSendOverdueReminders,
  invoiceActionsDisabled,
}: DashboardHomeKpiProps) {
  void appearance;
  const t = getDashboardHomeCopy(locale);
  const money = useMoney();
  const emptyAccount = clients.length === 0;

  const unpaid = useMemo(() => clients.filter((c) => c.status === "unpaid"), [clients]);

  const unpaidTotal = useMemo(() => unpaid.reduce((s, c) => s + c.amountDue, 0), [unpaid]);

  const buckets = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let notDue = 0;
    let overdueAmount = 0;
    let dueSoonAmount = 0;
    let notDueAmount = 0;
    for (const c of unpaid) {
      const b = unpaidDueBucket(c.dueDate);
      if (b === "overdue") {
        overdue += 1;
        overdueAmount += c.amountDue;
      } else if (b === "dueSoon") {
        dueSoon += 1;
        dueSoonAmount += c.amountDue;
      } else if (b === "notDue") {
        notDue += 1;
        notDueAmount += c.amountDue;
      }
    }
    return { overdue, dueSoon, notDue, overdueAmount, dueSoonAmount, notDueAmount };
  }, [unpaid]);

  const barTotal = buckets.overdueAmount + buckets.dueSoonAmount + buckets.notDueAmount;

  const receivedThisMonth = useMemo(() => {
    const now = new Date();
    return calendarMonthPaidTotal(clients, now.getFullYear(), now.getMonth());
  }, [clients]);

  const avgDelay = useMemo(() => averagePaymentDelayDays(clients), [clients]);

  const labelClass =
    "text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pp-dash-muted)]";
  const heroValueClass =
    "mt-2 text-[2.25rem] font-semibold leading-none tracking-tight tabular-nums text-[var(--pp-dash-ink)] sm:text-[2.5rem]";
  const statValueClass =
    "mt-2 text-2xl font-semibold tracking-tight tabular-nums text-[var(--pp-dash-ink)]";

  if (emptyAccount) {
    return (
      <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-4">
        <button
          type="button"
          onClick={onAddClient}
          className="pp-dash-card pp-dash-blur-in p-5 text-left sm:p-6"
          style={{ "--pp-rise-delay": "0.04s" } as CSSProperties}
        >
          <p className={labelClass}>{t.kpiUnpaid}</p>
          <p className="mt-3 text-sm font-medium text-[var(--pp-dash-ink)]">{t.kpiEmptyCta}</p>
        </button>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 lg:gap-3">
          {[t.kpiReceivedMonth, t.kpiAvgDelay, t.kpiRemindersSent].map((title, i) => (
            <button
              key={title}
              type="button"
              onClick={onAddClient}
              className="pp-dash-card pp-dash-blur-in p-4 text-left"
              style={{ "--pp-rise-delay": `${0.1 + i * 0.04}s` } as CSSProperties}
            >
              <p className={labelClass}>{title}</p>
              <p className="mt-2 text-sm text-[var(--pp-dash-muted)]">{t.kpiEmptyCta}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:gap-4">
      <section
        className="pp-dash-card pp-dash-blur-in flex flex-col p-5 sm:p-6"
        style={{ "--pp-rise-delay": "0.04s" } as CSSProperties}
      >
        <p className={labelClass}>{t.kpiUnpaid}</p>
        <p className={heroValueClass}>{money.format(unpaidTotal)}</p>
        <p className="mt-2 text-sm text-[var(--pp-dash-muted)]">
          {t.kpiOwedSubtext(unpaid.length, buckets.overdue)}
        </p>

        {barTotal > 0 ? (
          <>
            <div
              className="mt-5 flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--pp-dash-track)]"
              role="img"
              aria-label={`${t.legendOverdue}, ${t.legendDueSoon}, ${t.legendNotDue}`}
            >
              {buckets.overdueAmount > 0 ? (
                <span
                  className="h-full bg-[var(--pp-dash-overdue)]"
                  style={{ width: `${(buckets.overdueAmount / barTotal) * 100}%` }}
                />
              ) : null}
              {buckets.dueSoonAmount > 0 ? (
                <span
                  className="h-full bg-[var(--pp-dash-due-soon)]"
                  style={{ width: `${(buckets.dueSoonAmount / barTotal) * 100}%` }}
                />
              ) : null}
              {buckets.notDueAmount > 0 ? (
                <span
                  className="h-full bg-[var(--pp-dash-not-due)]"
                  style={{ width: `${(buckets.notDueAmount / barTotal) * 100}%` }}
                />
              ) : null}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--pp-dash-muted)]">
              <li className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--pp-dash-overdue)]" aria-hidden />
                {t.legendOverdue}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--pp-dash-due-soon)]" aria-hidden />
                {t.legendDueSoon}
              </li>
              <li className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--pp-dash-not-due)]" aria-hidden />
                {t.legendNotDue}
              </li>
            </ul>
          </>
        ) : null}

        <div className="mt-5">
          <button
            type="button"
            disabled={invoiceActionsDisabled || buckets.overdue === 0}
            onClick={onSendOverdueReminders}
            className="pp-dash-btn-ink inline-flex px-4 py-2.5 text-sm disabled:opacity-50"
          >
            {t.sendRemindersBtn(buckets.overdue)}
          </button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        <div
          className="pp-dash-card pp-dash-blur-in p-4 sm:p-5"
          style={{ "--pp-rise-delay": "0.1s" } as CSSProperties}
        >
          <p className={labelClass}>{t.kpiReceivedMonth}</p>
          <p className={statValueClass}>{money.format(receivedThisMonth)}</p>
        </div>
        <div
          className="pp-dash-card pp-dash-blur-in p-4 sm:p-5"
          style={{ "--pp-rise-delay": "0.14s" } as CSSProperties}
        >
          <p className={labelClass}>{t.kpiAvgDelay}</p>
          {avgDelay === null ? (
            <p className="mt-2 text-sm font-medium text-[var(--pp-dash-muted)]">{t.kpiNoHistory}</p>
          ) : (
            <p className={statValueClass}>
              {avgDelay}{" "}
              <span className="text-sm font-medium text-[var(--pp-dash-muted)]">{t.kpiDays}</span>
            </p>
          )}
        </div>
        <div
          className="pp-dash-card pp-dash-blur-in p-4 sm:p-5"
          style={{ "--pp-rise-delay": "0.18s" } as CSSProperties}
        >
          <p className={labelClass}>{t.kpiRemindersSent}</p>
          <p className={statValueClass}>{t.remindersThisMonth(remindersSentThisMonth)}</p>
        </div>
      </div>
    </div>
  );
}
