"use client";

import Link from "next/link";
import type { Client } from "./types";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { AppLocale } from "@/lib/app-locale";
import { getDashboardAnalyticsCopy } from "@/lib/messages/dashboard-analytics-copy";
import { getDashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";
import { OnboardingTasks, type OnboardingProfileSnapshot } from "./onboarding-tasks";
import { TreasuryForecastChart } from "./treasury-forecast-chart";
import { WorkspacesPanel } from "./workspaces-panel";
import { useWorkspace } from "@/app/workspace-context";

type DashboardHomeAsideProps = {
  locale: AppLocale;
  appearance: UiResolvedAppearance;
  clients: Client[];
  fullCharts: boolean;
  profile: OnboardingProfileSnapshot;
  clientCount: number;
  hasSentReminder: boolean;
  autoRemindersEnabled: boolean;
  googleClientIdConfigured: boolean;
  userEmail?: string | null;
  onOpenAddClient: () => void;
  memberReadOnly?: boolean;
};

export function DashboardHomeAside({
  locale,
  appearance,
  clients,
  fullCharts,
  profile,
  clientCount,
  hasSentReminder,
  autoRemindersEnabled,
  googleClientIdConfigured,
  userEmail,
  onOpenAddClient,
  memberReadOnly,
}: DashboardHomeAsideProps) {
  const ws = useWorkspace();
  const light = appearance === "light";
  const homeCopy = getDashboardHomeCopy(locale);
  const analyticsCopy = getDashboardAnalyticsCopy(locale);

  const orgLine = [profile.companyName.trim(), profile.country.trim()].filter(Boolean).join(" · ");
  const contactLine = userEmail?.trim() || "";

  return (
    <aside className="flex min-w-0 flex-col gap-4" aria-label={homeCopy.asideLabel}>
      <OnboardingTasks
        layout="column"
        locale={locale}
        appearance={appearance}
        profile={profile}
        clientCount={clientCount}
        hasSentReminder={hasSentReminder}
        autoRemindersEnabled={autoRemindersEnabled}
        googleClientIdConfigured={googleClientIdConfigured}
      />

      {fullCharts ? (
        <div
          className={`pp-dashboard-card-interactive rounded-2xl border p-4 ${
            light
              ? "border-slate-200 bg-white hover:border-sky-300/60"
              : "border-white/[0.08] bg-[#14141c] hover:border-sky-500/35"
          }`}
        >
          <TreasuryForecastChart clients={clients} locale={locale} light={light} copy={analyticsCopy} />
        </div>
      ) : null}

      {ws.supabaseMode && ws.workspaces.length > 0 ? (
        <div
          className={`rounded-2xl border p-4 ${
            light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"
          }`}
        >
          <WorkspacesPanel locale={locale} appearance={appearance} variant="compact" />
        </div>
      ) : null}

      <div
        className={`rounded-2xl border p-4 ${
          light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"
        }`}
      >
        <h3 className={`text-sm font-semibold ${light ? "text-slate-900" : "text-white"}`}>{homeCopy.asideOrgTitle}</h3>
        <p className={`mt-2 text-xs leading-relaxed ${light ? "text-slate-600" : "text-slate-400"}`}>
          {orgLine || homeCopy.asideOrgEmpty}
          {contactLine ? (
            <>
              <br />
              <span className={light ? "text-slate-500" : "text-slate-500"}>{contactLine}</span>
            </>
          ) : null}
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <Link
            href="/dashboard/organisation"
            className={`inline-flex justify-center rounded-lg px-3 py-2 text-xs font-semibold transition ${
              light
                ? "border border-slate-200 text-slate-700 hover:bg-slate-50"
                : "border border-white/10 text-slate-200 hover:bg-white/[0.06]"
            }`}
          >
            {homeCopy.asideOrgOpen}
          </Link>
          {!memberReadOnly ? (
            <button
              type="button"
              onClick={onOpenAddClient}
              className={`inline-flex justify-center rounded-lg px-3 py-2 text-xs font-semibold text-white transition ${
                light ? "bg-violet-600 hover:bg-violet-700" : "bg-violet-600/90 hover:bg-violet-600"
              }`}
            >
              {homeCopy.newClient}
            </button>
          ) : null}
        </div>
      </div>

      <div
        className={`rounded-2xl border p-4 ${
          light ? "border-slate-200 bg-slate-50/80" : "border-white/[0.08] bg-white/[0.03]"
        }`}
      >
        <h3 className={`text-xs font-semibold uppercase tracking-wide ${light ? "text-slate-500" : "text-slate-500"}`}>
          {homeCopy.asideShortcutsTitle}
        </h3>
        <ul className={`mt-3 space-y-2 text-xs font-medium ${light ? "text-slate-700" : "text-slate-300"}`}>
          <li>
            <Link href="/dashboard/pipeline" className={light ? "text-emerald-700 hover:underline" : "text-emerald-300 hover:underline"}>
              {homeCopy.navPipeline}
            </Link>
          </li>
          <li>
            <Link href="/dashboard/integrations" className={light ? "hover:text-slate-900 hover:underline" : "hover:text-white hover:underline"}>
              {homeCopy.navIntegrations}
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("relances");
                el?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={light ? "text-left hover:text-slate-900 hover:underline" : "text-left hover:text-white hover:underline"}
            >
              {homeCopy.navRelances}
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
