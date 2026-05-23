"use client";

import { motion } from "framer-motion";
import type { LandingCopy } from "@/lib/messages/landing-copy";

type RecurringCopy = Pick<
  LandingCopy,
  | "recurringImgAlt"
  | "recurringArrowAria"
  | "recurringStep1Label"
  | "recurringStep1Badge"
  | "recurringStep1Body"
  | "recurringStep2Label"
  | "recurringStep2Badge"
  | "recurringStep2Body"
>;

/** Illustration facture payée → ligne du mois suivant (parcours démo). */
export function LandingRecurringCycleVisual({ t }: { t: RecurringCopy }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_15%_10%,rgba(139,92,246,0.2),transparent_45%),linear-gradient(160deg,#030712,#0b1025)] p-5 shadow-[0_24px_56px_-12px_rgba(0,0,0,0.45),0_0_40px_-8px_rgba(139,92,246,0.1)] ring-1 ring-white/10 sm:p-6 lg:min-h-[22rem]"
      role="img"
      aria-label={t.recurringImgAlt}
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={false}
        animate={{ opacity: [0.85, 1, 0.86] }}
        transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="relative flex flex-col gap-4">
        <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/12 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/90">{t.recurringStep1Label}</p>
            <span className="shrink-0 rounded-full bg-emerald-400/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-100">
              {t.recurringStep1Badge}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-100/90">{t.recurringStep1Body}</p>
        </div>
        <div className="flex justify-center">
          <motion.div
            className="rounded-full border border-sky-400/40 bg-sky-500/10 p-2 text-sky-200 shadow-lg"
            animate={{ rotate: [0, -12, 0, 12, 0], scale: [1, 1.08, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            aria-label={t.recurringArrowAria}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
            </svg>
          </motion.div>
        </div>
        <div className="rounded-xl border border-orange-300/35 bg-orange-500/12 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-100/90">{t.recurringStep2Label}</p>
            <span className="max-w-[min(100%,11rem)] shrink-0 rounded-full bg-orange-400/25 px-2.5 py-1 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-orange-100">
              {t.recurringStep2Badge}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-100/90">{t.recurringStep2Body}</p>
        </div>
      </div>
    </div>
  );
}
