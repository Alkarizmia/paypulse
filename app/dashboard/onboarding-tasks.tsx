"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { AppLocale } from "@/lib/app-locale";
import { getDashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";

const DISMISS_KEY = "paypulss_onboarding_dismissed_v1";

export type OnboardingProfileSnapshot = {
  companyName: string;
  country: string;
};

type OnboardingTasksProps = {
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  profile: OnboardingProfileSnapshot;
  clientCount: number;
  hasSentReminder: boolean;
  autoRemindersEnabled: boolean;
  googleClientIdConfigured: boolean;
  /** column = panneau latéral desktop ; floating = mobile / repli */
  layout?: "column" | "floating";
};

type TaskId = "org" | "google" | "client" | "reminder" | "auto";

function taskDone(
  id: TaskId,
  ctx: {
    profile: OnboardingProfileSnapshot;
    clientCount: number;
    hasSentReminder: boolean;
    autoRemindersEnabled: boolean;
    googleClientIdConfigured: boolean;
  },
): boolean {
  switch (id) {
    case "org":
      return Boolean(ctx.profile.companyName.trim() && ctx.profile.country.trim());
    case "google":
      return ctx.googleClientIdConfigured;
    case "client":
      return ctx.clientCount > 0;
    case "reminder":
      return ctx.hasSentReminder;
    case "auto":
      return ctx.autoRemindersEnabled;
  }
}

function readDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(DISMISS_KEY) === "1";
}

export function OnboardingTasks({
  locale,
  appearance,
  profile,
  clientCount,
  hasSentReminder,
  autoRemindersEnabled,
  googleClientIdConfigured,
  layout = "floating",
}: OnboardingTasksProps) {
  const light = appearance === "light";
  const t = getDashboardHomeCopy(locale);
  const [dismissed, setDismissed] = useState(false);
  const [expandedId, setExpandedId] = useState<TaskId | null>(null);
  const [mounted, setMounted] = useState(false);

  const ctx = { profile, clientCount, hasSentReminder, autoRemindersEnabled, googleClientIdConfigured };

  const tasks = useMemo(
    () =>
      [
        { id: "org" as const, label: t.onboardingOrg, href: "/dashboard/organisation", cta: t.onboardingCtaOrg },
        {
          id: "google" as const,
          label: t.onboardingGmail,
          href: "/dashboard/integrations",
          cta: t.onboardingCtaIntegrations,
        },
        { id: "client" as const, label: t.onboardingClient, href: "/dashboard#add-client", cta: t.onboardingCtaAdd },
        { id: "reminder" as const, label: t.onboardingReminder, href: "/dashboard#relances", cta: t.onboardingCtaRelances },
        { id: "auto" as const, label: t.onboardingAuto, href: "/dashboard#relances", cta: t.onboardingCtaRelances },
      ].map((task) => ({ ...task, done: taskDone(task.id, ctx) })),
    [t, profile, clientCount, hasSentReminder, autoRemindersEnabled, googleClientIdConfigured],
  );

  const doneCount = tasks.filter((x) => x.done).length;
  const allDone = doneCount === tasks.length;
  const firstOpen = tasks.find((x) => !x.done)?.id ?? null;

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setDismissed(readDismissed());
      setExpandedId(firstOpen);
    });
  }, [firstOpen]);

  const dismiss = useCallback(() => {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }, []);

  const showAgain = useCallback(() => {
    window.localStorage.removeItem(DISMISS_KEY);
    setDismissed(false);
    setExpandedId(firstOpen);
  }, [firstOpen]);

  if (!mounted || allDone) return null;

  if (dismissed) {
    const dismissedBtnCls =
      layout === "column"
        ? `flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
            light
              ? "border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50"
              : "border-white/10 bg-[#14141c] text-slate-200 hover:border-emerald-500/40 hover:bg-emerald-500/10"
          }`
        : `fixed bottom-6 right-4 z-40 flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold shadow-lg transition lg:right-8 ${
            light
              ? "border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50"
              : "border-white/10 bg-[#14141c] text-slate-200 hover:border-emerald-500/40 hover:bg-emerald-500/10"
          }`;

    return (
      <button
        type="button"
        onClick={showAgain}
        className={dismissedBtnCls}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500" aria-hidden>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </span>
        {t.onboardingShowAgain}
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${
            light ? "bg-slate-100 text-slate-600" : "bg-white/10 text-slate-400"
          }`}
        >
          {tasks.length - doneCount}
        </span>
      </button>
    );
  }

  const shellFrame = light
    ? "border-slate-300/90 bg-slate-50 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.18)]"
    : "border-white/15 bg-[#0a0a10] shadow-[0_24px_56px_-8px_rgba(0,0,0,0.65)]";

  const screenBg = light ? "bg-white" : "bg-[#14141c]";

  const asideCls =
    layout === "column"
      ? "w-full"
      : "fixed bottom-4 right-4 z-40 w-[min(100vw-2rem,280px)] lg:bottom-8 lg:right-8";

  return (
    <aside className={asideCls} aria-label={t.onboardingTitle}>
      <div className={`overflow-hidden rounded-[1.75rem] border-[3px] p-2 ${shellFrame}`}>
        <div className={`mx-auto mb-2 h-1 w-16 rounded-full ${light ? "bg-slate-300" : "bg-white/20"}`} aria-hidden />
        <div className={`rounded-[1.35rem] ${screenBg}`}>
          <div
            className={`flex items-center justify-between gap-2 border-b px-3.5 py-3 ${
              light ? "border-slate-100" : "border-white/[0.06]"
            }`}
          >
            <div>
              <h3 className={`text-sm font-semibold ${light ? "text-slate-900" : "text-white"}`}>{t.onboardingTitle}</h3>
              <p className={`text-[10px] tabular-nums ${light ? "text-slate-500" : "text-slate-500"}`}>
                {doneCount}/{tasks.length}
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                light ? "text-slate-500 hover:bg-slate-100 hover:text-slate-800" : "text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
              aria-label={t.onboardingDismiss}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <ul className="max-h-[min(52vh,320px)] overflow-y-auto px-2 py-2">
            {tasks.map((task) => {
              const open = expandedId === task.id;
              return (
                <li key={task.id} className="mb-1">
                  <button
                    type="button"
                    onClick={() => setExpandedId(open ? null : task.id)}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition ${
                      open
                        ? light
                          ? "bg-emerald-50"
                          : "bg-emerald-500/10"
                        : light
                          ? "hover:bg-slate-50"
                          : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        task.done
                          ? light
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-emerald-500/25 text-emerald-200"
                          : light
                            ? "border border-slate-300 text-slate-400"
                            : "border border-white/20 text-slate-500"
                      }`}
                      aria-hidden
                    >
                      {task.done ? "✓" : ""}
                    </span>
                    <span
                      className={`min-w-0 flex-1 text-xs font-medium leading-snug ${
                        task.done
                          ? light
                            ? "text-slate-400 line-through"
                            : "text-slate-500 line-through"
                          : light
                            ? "text-slate-800"
                            : "text-slate-200"
                      }`}
                    >
                      {task.label}
                    </span>
                    <svg
                      className={`h-4 w-4 shrink-0 transition ${open ? "rotate-180" : ""} ${light ? "text-slate-400" : "text-slate-500"}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {open && !task.done ? (
                    <div className={`px-3 pb-2.5 pt-0.5 ${light ? "text-slate-600" : "text-slate-400"}`}>
                      <Link
                        href={task.href}
                        className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition ${
                          light ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-600/90 hover:bg-emerald-600"
                        }`}
                      >
                        {task.cta}
                      </Link>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div
            className={`flex items-center justify-around border-t px-2 py-2.5 ${
              light ? "border-slate-100 bg-slate-50/80" : "border-white/[0.06] bg-black/20"
            }`}
            aria-hidden
          >
            <span className={`text-[10px] font-medium ${light ? "text-emerald-600" : "text-emerald-400"}`}>●</span>
            <span className={`text-[10px] ${light ? "text-slate-400" : "text-slate-600"}`}>○</span>
            <span className={`text-[10px] ${light ? "text-slate-400" : "text-slate-600"}`}>○</span>
            <span className={`relative text-[10px] font-medium ${light ? "text-slate-500" : "text-slate-400"}`}>
              ○
              {tasks.length - doneCount > 0 ? (
                <span className="absolute -right-2 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-0.5 text-[8px] font-bold text-white">
                  {tasks.length - doneCount}
                </span>
              ) : null}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
