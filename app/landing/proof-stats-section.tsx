"use client";

import { animate, motion, useInView } from "framer-motion";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/app/landing/landing-motion";
import { useHydrated } from "@/lib/use-hydrated";

export type ProofStatsCopy = {
  socialProof: string;
  statsTitle: string;
  statsSub: string;
  stat1Lab: string;
  stat2Lab: string;
  stat3Lab: string;
};

import type { AppLocale } from "@/lib/app-locale";

const MINUS = "\u2212";

function formatNegPercent(locale: AppLocale, n: number): string {
  const v = Math.round(Math.abs(n));
  return locale === "fr" ? `${MINUS}${v} %` : `${MINUS}${v}%`;
}

function formatPosPercent(locale: AppLocale, n: number): string {
  const v = Math.round(Math.max(0, n));
  return locale === "fr" ? `+${v} %` : `+${v}%`;
}

function formatHours(locale: AppLocale, n: number): string {
  const v = Math.round(Math.max(0, n));
  if (locale === "fr") return `${v} h`;
  if (locale === "nl") return `${v} u`;
  return `${v}h`;
}

const DURATION = 2.15;
const STAGGER = 0.22;

export function ProofStatsSection({ locale, copy }: { locale: AppLocale; copy: ProofStatsCopy }) {
  const reduce = usePreferMinimalMotion();
  const hydrated = useHydrated();
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.28, margin: "-10% 0px -14% 0px" });
  const [v1, setV1] = useState(-35);
  const [v2, setV2] = useState(18);
  const [v3, setV3] = useState(4);
  const runIdRef = useRef(0);

  useEffect(() => {
    if (!hydrated) return;

    if (reduce) {
      setV1(-35);
      setV2(18);
      setV3(4);
      return;
    }

    if (!inView) {
      setV1(-35);
      setV2(18);
      setV3(4);
      return;
    }

    const runId = ++runIdRef.current;
    setV1(-6);
    setV2(2);
    setV3(0);

    const c1 = animate(-6, -35, {
      duration: DURATION,
      ease: [0.18, 1, 0.32, 1],
      onUpdate: (latest) => {
        if (runIdRef.current === runId) setV1(latest);
      },
    });
    const c2 = animate(2, 18, {
      duration: DURATION,
      delay: STAGGER,
      ease: [0.18, 1, 0.32, 1],
      onUpdate: (latest) => {
        if (runIdRef.current === runId) setV2(latest);
      },
    });
    const c3 = animate(0, 4, {
      duration: DURATION * 0.92,
      delay: STAGGER * 2,
      ease: [0.18, 1, 0.32, 1],
      onUpdate: (latest) => {
        if (runIdRef.current === runId) setV3(latest);
      },
    });

    return () => {
      runIdRef.current += 1;
      c1.stop();
      c2.stop();
      c3.stop();
    };
  }, [hydrated, inView, reduce]);

  const s1 = formatNegPercent(locale, v1);
  const s2 = formatPosPercent(locale, v2);
  const s3 = formatHours(locale, v3);

  return (
    <section id="proof" ref={rootRef} className="scroll-mt-28 border-t border-slate-200 bg-slate-50 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-5xl text-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#34D399]/90">{copy.socialProof}</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{copy.statsTitle}</h2>
        </Reveal>
        <Reveal className="mx-auto mt-3 max-w-xl text-sm text-slate-600" delay={0.06}>
          {copy.statsSub}
        </Reveal>
        <motion.div
          className="mt-14 grid gap-4 sm:grid-cols-3"
          initial={false}
          whileInView="show"
          viewport={{ once: true, margin: "-40px", amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.04 } } }}
        >
          {[
            { val: s1, lab: copy.stat1Lab },
            { val: s2, lab: copy.stat2Lab },
            { val: s3, lab: copy.stat3Lab },
          ].map((s) => (
            <motion.div
              key={s.lab}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
              }}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm backdrop-blur-md transition hover:border-violet-300/60 hover:shadow-[0_0_40px_-20px_rgba(139,92,246,0.3)]"
            >
              <p className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900 sm:text-4xl">{s.val}</p>
              <p className="mt-2 text-sm text-slate-600">{s.lab}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
