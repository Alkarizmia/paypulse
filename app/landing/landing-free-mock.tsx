"use client";

import { useMemo, useState } from "react";
import {
  formatLandingDemoUsd,
  LANDING_DEMO_COPY,
} from "@/lib/messages/landing-demo-copy";

type Status = "wait" | "remind" | "paid";
type MockTheme = "dark" | "light";

type Row = {
  id: string;
  name: string;
  amount: number;
  detail: string;
  status: Status;
};

const INITIAL: Row[] = [
  { id: "lumen", name: "Studio Lumen", amount: 1200, detail: LANDING_DEMO_COPY.daysLate, status: "wait" },
  { id: "nord", name: "Atelier Nord", amount: 480, detail: LANDING_DEMO_COPY.reminderSent, status: "remind" },
  { id: "marc", name: "Marc D.", amount: 900, detail: LANDING_DEMO_COPY.paidToday, status: "paid" },
];

function nextStatus(s: Status): Status {
  if (s === "wait") return "remind";
  if (s === "remind") return "paid";
  return "paid";
}

function statusLabel(s: Status): string {
  if (s === "wait") return LANDING_DEMO_COPY.statusPending;
  if (s === "remind") return LANDING_DEMO_COPY.statusFollowedUp;
  return LANDING_DEMO_COPY.statusPaid;
}

function statusDetail(s: Status): string {
  if (s === "wait") return LANDING_DEMO_COPY.daysLate;
  if (s === "remind") return LANDING_DEMO_COPY.reminderSent;
  return LANDING_DEMO_COPY.paidToday;
}

/** Interactive Free mock for the public landing (English + USD only). */
export function LandingFreeMock() {
  const t = LANDING_DEMO_COPY;
  const [rows, setRows] = useState<Row[]>(INITIAL);
  const [nudge, setNudge] = useState(true);
  const [pulse, setPulse] = useState(false);
  const [theme, setTheme] = useState<MockTheme>("dark");

  const { total, openCount } = useMemo(() => {
    let total = 0;
    let openCount = 0;
    for (const row of rows) {
      if (row.status !== "paid") {
        total += row.amount;
        openCount += 1;
      }
    }
    return { total, openCount };
  }, [rows]);

  function onRowActivate(id: string) {
    setNudge(false);
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const status = nextStatus(row.status);
        return {
          ...row,
          status,
          detail: statusDetail(status),
        };
      }),
    );
    setPulse(true);
    window.setTimeout(() => setPulse(false), 420);
  }

  const openHint =
    openCount === 1 ? t.openInvoicesOne : t.openInvoicesMany(openCount);

  return (
    <div
      className={`pp-free-mock pp-glass pp-enter-mock ${theme === "light" ? "pp-free-mock--light" : ""}`}
      id="apercu"
      data-theme={theme}
    >
      <div className="pp-free-mock-chrome">
        <span className="pp-free-mock-dot" />
        <span className="pp-free-mock-dot" />
        <span className="pp-free-mock-dot" />
        <span className="pp-free-mock-title">{t.windowTitle}</span>
        <button
          type="button"
          className="pp-free-mock-theme"
          aria-label={theme === "dark" ? t.themeToLight : t.themeToDark}
          onClick={() => setTheme((th) => (th === "dark" ? "light" : "dark"))}
        >
          {theme === "dark" ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      <div className="pp-free-mock-body">
        <div className={`pp-free-mock-total ${pulse ? "pp-free-mock-total--pulse" : ""}`}>
          <p className="pp-free-mock-total-label">{t.toCollect}</p>
          <p className="pp-free-mock-total-value">{formatLandingDemoUsd(total)}</p>
          <p className="pp-free-mock-total-hint">{openHint}</p>
        </div>

        <ul className="pp-free-mock-list">
          {rows.map((row, index) => (
            <li key={row.id}>
              <button
                type="button"
                className={`pp-free-mock-row pp-free-mock-row--btn ${
                  nudge && index === 0 ? "pp-affordance-pulse" : ""
                }`}
                onClick={() => onRowActivate(row.id)}
                aria-label={`${row.name}, ${statusLabel(row.status)}`}
              >
                <div className="pp-free-mock-row-main">
                  <span className="pp-free-mock-name">{row.name}</span>
                  <span className="pp-free-mock-amount">{formatLandingDemoUsd(row.amount)}</span>
                </div>
                <div className="pp-free-mock-row-meta">
                  <span className="pp-free-mock-detail">{row.detail}</span>
                  <span className={`pp-free-mock-badge pp-free-mock-badge--${row.status}`}>
                    {statusLabel(row.status)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
