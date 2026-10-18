"use client";

import { useMemo, useState } from "react";
import type { AppLocale } from "@/lib/app-locale";
import { getLandingLossCopy, getLandingMockHint } from "@/lib/messages/landing-loss-copy";

type Status = "wait" | "remind" | "paid";

type Row = {
  id: string;
  name: string;
  amount: number;
  detail: string;
  status: Status;
};

const INITIAL: Row[] = [
  {
    id: "lumen",
    name: "Studio Lumen",
    amount: 1200,
    detail: "12 jours de retard",
    status: "wait",
  },
  {
    id: "nord",
    name: "Atelier Nord",
    amount: 480,
    detail: "Relance envoyée",
    status: "remind",
  },
  {
    id: "marc",
    name: "Marc D.",
    amount: 900,
    detail: "Réglé aujourd'hui",
    status: "paid",
  },
];

function nextStatus(s: Status): Status {
  if (s === "wait") return "remind";
  if (s === "remind") return "paid";
  return "paid";
}

function formatEuro(value: number): string {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} €`;
  }
}

/** Maquette Free interactive : tap = En attente → Relancé → Payé. État local uniquement. */
export function LandingFreeMock({ locale = "fr" }: { locale?: AppLocale }) {
  const t = getLandingLossCopy(locale);
  const hint = getLandingMockHint(locale);
  const [rows, setRows] = useState<Row[]>(INITIAL);
  const [hintVisible, setHintVisible] = useState(true);
  const [pulse, setPulse] = useState(false);

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

  const statusLabel = (s: Status) =>
    s === "wait" ? t.statusWait : s === "remind" ? t.statusRemind : t.statusPaid;

  function onRowActivate(id: string) {
    setHintVisible(false);
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const status = nextStatus(row.status);
        return {
          ...row,
          status,
          detail:
            status === "wait"
              ? "En attente"
              : status === "remind"
                ? "Relance envoyée"
                : "Réglé",
        };
      }),
    );
    setPulse(true);
    window.setTimeout(() => setPulse(false), 420);
  }

  return (
    <div className="pp-free-mock" id="apercu">
      <div className="pp-free-mock-chrome">
        <span className="pp-free-mock-dot" />
        <span className="pp-free-mock-dot" />
        <span className="pp-free-mock-dot" />
        <span className="pp-free-mock-title">PayPulss · Accueil</span>
      </div>

      <div className="pp-free-mock-body">
        {hintVisible ? (
          <p className="pp-free-mock-hint" role="status">
            {hint}
          </p>
        ) : null}

        <div className={`pp-free-mock-total ${pulse ? "pp-free-mock-total--pulse" : ""}`}>
          <p className="pp-free-mock-total-label">À récupérer</p>
          <p className="pp-free-mock-total-value">{formatEuro(total)}</p>
          <p className="pp-free-mock-total-hint">
            {openCount} dossier{openCount === 1 ? "" : "s"} ouvert{openCount === 1 ? "" : "s"}
          </p>
        </div>

        <ul className="pp-free-mock-list">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                className="pp-free-mock-row pp-free-mock-row--btn"
                onClick={() => onRowActivate(row.id)}
                aria-label={`${row.name}, ${statusLabel(row.status)}. Activer pour changer le statut.`}
              >
                <div className="pp-free-mock-row-main">
                  <span className="pp-free-mock-name">{row.name}</span>
                  <span className="pp-free-mock-amount">{formatEuro(row.amount)}</span>
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

        <p className="pp-free-mock-foot">Totaux et liste de dossiers, sans tableur.</p>
      </div>
    </div>
  );
}
