"use client";

import { useMemo, useState } from "react";
import type { CalendarEvent, CalendarEventKind } from "@/lib/organization-calendar";
import {
  calendarMonthMatrix,
  eventsInMonth,
  eventsOnDate,
  todayYmd,
} from "@/lib/organization-calendar";
import type { OrganizationCopy } from "@/lib/messages/organization-copy";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import { useMoney } from "@/app/display-currency-context";

type OrganisationCalendarProps = {
  events: CalendarEvent[];
  copy: OrganizationCopy;
  appearance: UiResolvedAppearance;
  localeMonthLabel: (year: number, month: number) => string;
};

const KIND_STYLES: Record<
  CalendarEventKind,
  { dot: string; chip: string; chipDark: string }
> = {
  due: {
    dot: "bg-amber-400",
    chip: "border-amber-200 bg-amber-50 text-amber-900",
    chipDark: "border-amber-500/30 bg-amber-500/10 text-amber-100",
  },
  payment: {
    dot: "bg-emerald-400",
    chip: "border-emerald-200 bg-emerald-50 text-emerald-900",
    chipDark: "border-emerald-500/30 bg-emerald-500/10 text-emerald-100",
  },
  reminder_sent: {
    dot: "bg-sky-400",
    chip: "border-sky-200 bg-sky-50 text-sky-900",
    chipDark: "border-sky-500/30 bg-sky-500/10 text-sky-100",
  },
  reminder_planned: {
    dot: "bg-violet-400 ring-2 ring-violet-400/30 ring-offset-1 ring-offset-transparent",
    chip: "border-violet-200 bg-violet-50 text-violet-900",
    chipDark: "border-violet-500/30 bg-violet-500/10 text-violet-100",
  },
  custom: {
    dot: "bg-slate-400",
    chip: "border-slate-200 bg-slate-50 text-slate-800",
    chipDark: "border-white/15 bg-white/[0.06] text-slate-200",
  },
};

export function OrganisationCalendar({ events, copy, appearance, localeMonthLabel }: OrganisationCalendarProps) {
  const money = useMoney();
  const light = appearance === "light";
  const today = todayYmd();
  const [cursor, setCursor] = useState(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  });
  const [selected, setSelected] = useState(today);

  const matrix = useMemo(() => calendarMonthMatrix(cursor.year, cursor.month), [cursor.year, cursor.month]);
  const monthEvents = useMemo(
    () => eventsInMonth(events, cursor.year, cursor.month),
    [events, cursor.year, cursor.month],
  );

  const dotsByDate = useMemo(() => {
    const map = new Map<string, Set<CalendarEventKind>>();
    for (const e of monthEvents) {
      const set = map.get(e.date) ?? new Set();
      set.add(e.kind);
      map.set(e.date, set);
    }
    return map;
  }, [monthEvents]);

  const dayEvents = useMemo(() => eventsOnDate(events, selected), [events, selected]);

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const card = light
    ? "rounded-2xl border border-slate-200 bg-white"
    : "rounded-2xl border border-white/[0.08] bg-[#14141c]";
  const headText = light ? "text-slate-900" : "text-white";
  const muted = light ? "text-slate-500" : "text-slate-400";

  return (
    <div className={`${card} p-4 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className={`text-base font-semibold ${headText}`}>{copy.calendarTitle}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              light ? "border-slate-200 text-slate-700 hover:bg-slate-50" : "border-white/10 text-slate-300 hover:bg-white/[0.06]"
            }`}
            aria-label={copy.prevMonth}
          >
            ←
          </button>
          <span className={`min-w-[10rem] text-center text-sm font-semibold tabular-nums ${headText}`}>
            {localeMonthLabel(cursor.year, cursor.month)}
          </span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
              light ? "border-slate-200 text-slate-700 hover:bg-slate-50" : "border-white/10 text-slate-300 hover:bg-white/[0.06]"
            }`}
            aria-label={copy.nextMonth}
          >
            →
          </button>
          <button
            type="button"
            onClick={() => {
              const t = new Date();
              setCursor({ year: t.getFullYear(), month: t.getMonth() });
              setSelected(todayYmd());
            }}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
              light ? "bg-violet-100 text-violet-800 hover:bg-violet-200" : "bg-violet-500/20 text-violet-200 hover:bg-violet-500/30"
            }`}
          >
            {copy.today}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
        {(
          [
            ["due", copy.legendDue],
            ["payment", copy.legendPayment],
            ["reminder_sent", copy.legendReminderSent],
            ["reminder_planned", copy.legendReminderPlanned],
            ["custom", copy.legendCustom],
          ] as const
        ).map(([kind, label]) => (
          <span key={kind} className={`inline-flex items-center gap-1.5 ${muted}`}>
            <span className={`h-2 w-2 rounded-full ${KIND_STYLES[kind].dot}`} aria-hidden />
            {label}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {copy.weekdays.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {matrix.flat().map((ymd, i) => {
          if (!ymd) {
            return <div key={`empty-${i}`} className="min-h-[4.25rem] rounded-lg" aria-hidden />;
          }
          const kinds = dotsByDate.get(ymd);
          const isSelected = ymd === selected;
          const isToday = ymd === today;
          return (
            <button
              key={ymd}
              type="button"
              onClick={() => setSelected(ymd)}
              className={`min-h-[4.25rem] rounded-lg border p-1 text-left transition ${
                isSelected
                  ? light
                    ? "border-violet-400 bg-violet-50 ring-1 ring-violet-300"
                    : "border-violet-500/50 bg-violet-500/10 ring-1 ring-violet-500/40"
                  : light
                    ? "border-slate-100 bg-slate-50/80 hover:border-slate-200 hover:bg-white"
                    : "border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05]"
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${
                  isToday
                    ? light
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-900"
                    : light
                      ? "text-slate-700"
                      : "text-slate-300"
                }`}
              >
                {Number.parseInt(ymd.slice(8), 10)}
              </span>
              <div className="mt-1 flex flex-wrap gap-0.5 px-0.5">
                {kinds
                  ? Array.from(kinds)
                      .slice(0, 4)
                      .map((k) => <span key={k} className={`h-1.5 w-1.5 rounded-full ${KIND_STYLES[k].dot}`} aria-hidden />)
                  : null}
              </div>
            </button>
          );
        })}
      </div>

      <div className={`mt-6 border-t pt-4 ${light ? "border-slate-200" : "border-white/[0.08]"}`}>
        <h3 className={`text-sm font-semibold ${headText}`}>{copy.dayDetail}</h3>
        <p className={`mt-0.5 text-xs ${muted}`}>{selected}</p>
        {dayEvents.length === 0 ? (
          <p className={`mt-3 text-sm ${muted}`}>{copy.noEventsDay}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {dayEvents.map((e) => {
              const st = KIND_STYLES[e.kind];
              return (
                <li
                  key={e.id}
                  className={`rounded-lg border px-3 py-2 text-sm ${light ? st.chip : st.chipDark}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="font-medium">{e.title}</span>
                    {typeof e.amountEur === "number" ? (
                      <span className="shrink-0 tabular-nums font-semibold">{money.format(e.amountEur)}</span>
                    ) : null}
                  </div>
                  {e.subtitle ? <p className="mt-0.5 text-xs opacity-80">{e.subtitle}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
