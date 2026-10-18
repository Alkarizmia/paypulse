"use client";

import { useMemo, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
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

type Tone = "danger" | "success" | "warning" | "accent";

export function DashboardHomeKpi({
  clients,
  locale,
  appearance,
  remindersSentCount,
  onAddClient,
  onReminders,
}: DashboardHomeKpiProps) {
  void appearance;
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

  const labelClass = "text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--pp-dash-muted)]";
  const valueClass = "mt-2 text-2xl font-semibold tracking-tight tabular-nums text-[var(--pp-dash-ink)] sm:text-[1.65rem]";
  const hintClass = "mt-2 text-sm font-medium leading-snug text-[var(--pp-dash-ink)]";

  function onEmptyKeyDown(e: KeyboardEvent<HTMLDivElement>, action: () => void) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  }

  function renderCard(opts: {
    tone: Tone;
    delay: string;
    title: string;
    emptyHint: string;
    onEmptyClick: () => void;
    filled: ReactNode;
  }) {
    const className = `pp-dash-kpi pp-dash-blur-in${emptyAccount ? " is-empty" : ""}`;
    const style = { "--pp-rise-delay": opts.delay } as CSSProperties;

    if (emptyAccount) {
      return (
        <div
          className={className}
          data-tone={opts.tone}
          style={style}
          role="button"
          tabIndex={0}
          onClick={opts.onEmptyClick}
          onKeyDown={(e) => onEmptyKeyDown(e, opts.onEmptyClick)}
        >
          <p className={labelClass}>{opts.title}</p>
          <p className={hintClass}>{opts.emptyHint}</p>
        </div>
      );
    }

    return (
      <div className={className} data-tone={opts.tone} style={style}>
        <p className={labelClass}>{opts.title}</p>
        {opts.filled}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
      {renderCard({
        tone: "danger",
        delay: "0.04s",
        title: t.kpiUnpaid,
        emptyHint: t.kpiHintUnpaid,
        onEmptyClick: onAddClient,
        filled: <p className={valueClass}>{money.format(unpaidTotal)}</p>,
      })}
      {renderCard({
        tone: "success",
        delay: "0.1s",
        title: t.kpiReceivedMonth,
        emptyHint: t.kpiHintReceived,
        onEmptyClick: onAddClient,
        filled: <p className={valueClass}>{money.format(receivedThisMonth)}</p>,
      })}
      {renderCard({
        tone: "warning",
        delay: "0.16s",
        title: t.kpiAvgDelay,
        emptyHint: t.kpiHintDelay,
        onEmptyClick: onAddClient,
        filled:
          avgDelay === null ? (
            <p className="mt-2 text-base font-medium text-[var(--pp-dash-muted)]">{t.kpiNoHistory}</p>
          ) : (
            <p className={valueClass}>
              {avgDelay} <span className="text-base font-medium text-[var(--pp-dash-muted)]">{t.kpiDays}</span>
            </p>
          ),
      })}
      {renderCard({
        tone: "accent",
        delay: "0.22s",
        title: t.kpiRemindersSent,
        emptyHint: t.kpiHintReminders,
        onEmptyClick: onAddClient,
        filled:
          remindersSentCount === 0 ? (
            <button
              type="button"
              onClick={onReminders}
              className="mt-2 text-left text-sm font-medium text-[var(--pp-dash-ink)]"
            >
              {t.kpiHintReminders}
            </button>
          ) : (
            <p className={valueClass}>{remindersSentCount}</p>
          ),
      })}
    </div>
  );
}
