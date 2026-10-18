"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppLocale } from "@/lib/app-locale";
import { getLandingLossCopy } from "@/lib/messages/landing-loss-copy";
import { PaypulssPulseDivider } from "@/app/landing/paypulss-pulse";

const DEFAULT_INVOICES = 3;
const DEFAULT_AMOUNT = 800;
const DEFAULT_MINUTES = 10;
const RELANCES_PER_INVOICE = 3;
const MAX_DEMO_ROWS = 5;

type Status = "wait" | "remind" | "paid";

type Props = {
  locale: AppLocale;
  ctaLabel: string;
  waitlistMode: boolean;
  onWaitlistClick: () => void;
  primaryHref: string;
};

function formatEuro(value: number, locale: AppLocale): string {
  const loc = locale === "en" ? "en-US" : locale === "nl" ? "nl-NL" : locale === "es" ? "es-ES" : "fr-FR";
  try {
    return new Intl.NumberFormat(loc, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  } catch {
    return `${Math.round(value)} €`;
  }
}

function formatTime(totalMinutes: number, hoursShort: string, minutesShort: string): string {
  const m = Math.max(0, Math.round(totalMinutes));
  if (m < 60) return `${m} ${minutesShort}`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return `${h} ${hoursShort}`;
  return `${h} ${hoursShort} ${String(rem).padStart(2, "0")}`;
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Compteur doux vers une cible (désactivé si reduced-motion). */
function useAnimatedNumber(target: number, reduced: boolean): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);

  useEffect(() => {
    if (reduced) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }
    const from = displayRef.current;
    const to = target;
    if (from === to) return;
    const duration = 320;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      const next = from + (to - from) * eased;
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, reduced]);

  return display;
}

export function LandingLossCalculator({
  locale,
  ctaLabel,
  waitlistMode,
  onWaitlistClick,
  primaryHref,
}: Props) {
  const t = getLandingLossCopy(locale);
  const reduced = usePrefersReducedMotion();
  const [invoices, setInvoices] = useState(DEFAULT_INVOICES);
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const [demoStatuses, setDemoStatuses] = useState<Status[]>([]);
  const [demoBlocked, setDemoBlocked] = useState<number | null>(null);
  const timersRef = useRef<number[]>([]);

  const blocked = invoices * amount;
  const timeMinutes = invoices * RELANCES_PER_INVOICE * minutes;
  const shownBlocked = demoBlocked !== null ? demoBlocked : blocked;

  const animBlocked = useAnimatedNumber(shownBlocked, reduced);
  const animTime = useAnimatedNumber(demoRunning || demoDone ? 0 : timeMinutes, reduced);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const runDemo = useCallback(() => {
    if (demoRunning) return;
    clearTimers();
    const n = Math.min(Math.max(invoices, 1), MAX_DEMO_ROWS);
    const startBlocked = invoices * amount;
    setDemoDone(false);
    setDemoRunning(true);
    setDemoBlocked(startBlocked);
    setDemoStatuses(Array.from({ length: n }, () => "wait" as Status));

    const stepMs = reduced ? 0 : 380;
    const timers: number[] = [];
    let delay = reduced ? 0 : 200;

    for (let i = 0; i < n; i++) {
      timers.push(
        window.setTimeout(() => {
          setDemoStatuses((prev) => {
            const next = [...prev];
            next[i] = "remind";
            return next;
          });
        }, delay),
      );
      delay += stepMs;
      timers.push(
        window.setTimeout(() => {
          setDemoStatuses((prev) => {
            const next = [...prev];
            next[i] = "paid";
            return next;
          });
          setDemoBlocked(startBlocked * (1 - (i + 1) / n));
        }, delay),
      );
      delay += stepMs;
    }

    timers.push(
      window.setTimeout(() => {
        setDemoBlocked(0);
        setDemoRunning(false);
        setDemoDone(true);
      }, delay + (reduced ? 0 : 120)),
    );
    timersRef.current = timers;
  }, [amount, clearTimers, demoRunning, invoices, reduced]);

  const onSliderInteract = () => {
    if (!demoDone && !demoRunning) {
      /* Premier mouvement : ne lance pas auto la démo, seulement recalcule.
         La démo reste sur le bouton pour rester contrôlée sur mobile. */
    }
  };

  const statusLabel = (s: Status) =>
    s === "wait" ? t.statusWait : s === "remind" ? t.statusRemind : t.statusPaid;

  return (
    <section id="perte" className="pp-loss scroll-mt-28 px-4 py-16 sm:px-6 sm:py-20" aria-labelledby="pp-loss-title">
      <div className="mx-auto max-w-lg">
        <PaypulssPulseDivider className="pp-loss-pulse mx-auto mb-8" />
        <h2 id="pp-loss-title" className="text-center text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
          {t.title}
        </h2>
        <p className="mt-3 text-center text-[15px] text-slate-400">{t.subtitle}</p>

        <div className="mt-10 space-y-8">
          <RangeField
            id="pp-loss-invoices"
            label={t.invoicesLabel}
            min={0}
            max={20}
            step={1}
            value={invoices}
            display={`${invoices}`}
            onChange={(v) => {
              onSliderInteract();
              setInvoices(v);
              setDemoDone(false);
              setDemoBlocked(null);
              setDemoStatuses([]);
            }}
          />
          <RangeField
            id="pp-loss-amount"
            label={t.amountLabel}
            min={100}
            max={3000}
            step={50}
            value={amount}
            display={formatEuro(amount, locale)}
            onChange={(v) => {
              onSliderInteract();
              setAmount(v);
              setDemoDone(false);
              setDemoBlocked(null);
              setDemoStatuses([]);
            }}
          />
          <RangeField
            id="pp-loss-minutes"
            label={t.minutesLabel}
            min={5}
            max={30}
            step={1}
            value={minutes}
            display={`${minutes} ${t.minutesShort}`}
            onChange={(v) => {
              onSliderInteract();
              setMinutes(v);
              setDemoDone(false);
              setDemoBlocked(null);
              setDemoStatuses([]);
            }}
          />
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">{t.assumption}</p>

        <div className="pp-loss-result mt-8 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-6 text-center">
          <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {formatEuro(animBlocked, locale)}
          </p>
          <p className="mt-1 text-sm text-slate-300">{t.blockedSuffix}</p>
          <p className="mt-5 text-xl font-semibold text-indigo-300 sm:text-2xl">
            {t.timePrefix} {formatTime(animTime, t.hoursShort, t.minutesShort)}
          </p>
          <p className="mt-1 text-sm text-slate-400">{t.timeSuffix}</p>
          <p className="mt-4 text-[11px] leading-relaxed text-slate-500">{t.disclaimer}</p>
        </div>

        {!demoDone ? (
          <button
            type="button"
            className="pp-lp-btn mt-8 w-full bg-white px-6 py-3.5 text-base text-slate-900 disabled:opacity-60"
            onClick={runDemo}
            disabled={demoRunning || invoices === 0}
          >
            {t.seeDifference}
          </button>
        ) : null}

        {(demoRunning || demoDone) && demoStatuses.length > 0 ? (
          <div className="mt-8 space-y-3" aria-live="polite">
            <DemoPulse active={!reduced && demoRunning} />
            <ul className="space-y-2">
              {demoStatuses.map((s, i) => (
                <li key={i} className={`pp-loss-row pp-loss-row--${s}`}>
                  <span className="font-medium text-white">{t.invoiceName(i + 1)}</span>
                  <span className={`pp-loss-badge pp-loss-badge--${s}`}>{statusLabel(s)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {demoDone ? (
          <div className="mt-8 text-center">
            <p className="text-base font-medium leading-relaxed text-white sm:text-lg">{t.finalMessage}</p>
            {waitlistMode ? (
              <button
                type="button"
                onClick={onWaitlistClick}
                className="pp-lp-btn mt-6 w-full bg-indigo-500 px-6 py-3.5 text-base text-white"
              >
                {ctaLabel}
              </button>
            ) : (
              <a href={primaryHref} className="pp-lp-btn mt-6 inline-flex w-full bg-indigo-500 px-6 py-3.5 text-base text-white">
                {ctaLabel}
              </a>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function RangeField({
  id,
  label,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-3 flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-slate-200">
          {label}
        </label>
        <span className="text-base font-semibold tabular-nums text-white" aria-hidden>
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="pp-loss-range"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={display}
        aria-label={label}
      />
    </div>
  );
}

function DemoPulse({ active }: { active: boolean }) {
  return (
    <div className={`pp-loss-demo-pulse ${active ? "pp-loss-demo-pulse--active" : ""}`} aria-hidden>
      <svg viewBox="0 0 280 20" fill="none" className="w-full">
        <path
          className="pp-pulse-line"
          d="M2 10 H60 L72 4 L84 16 L96 8 L108 10 H172 L184 4 L196 16 L208 10 H278"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="36" cy="10" r="3.5" className="pp-pulse-dot pp-pulse-dot--wait" />
        <circle cx="140" cy="10" r="3.5" className="pp-pulse-dot pp-pulse-dot--remind" />
        <circle cx="244" cy="10" r="3.5" className="pp-pulse-dot pp-pulse-dot--paid" />
      </svg>
    </div>
  );
}
