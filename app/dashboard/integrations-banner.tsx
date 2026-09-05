"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { UiResolvedAppearance } from "@/lib/ui-theme";
import type { AppLocale } from "@/lib/app-locale";
import { getDashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type IntegrationsBannerProps = {
  locale: AppLocale;
  appearance: UiResolvedAppearance;
};

function pillClass(light: boolean, connected: boolean) {
  if (connected) {
    return light
      ? "inline-flex rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success"
      : "inline-flex rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success";
  }
  return "pp-btn-secondary px-3 py-1 text-xs";
}

export function IntegrationsBanner({ locale, appearance }: IntegrationsBannerProps) {
  const light = appearance === "light";
  const t = getDashboardHomeCopy(locale);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const res = await fetch("/api/integrations/google-calendar/status", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as { connected?: boolean; configured?: boolean };
      if (json.configured === false) return;
      setConnected(Boolean(json.connected));
    })();
  }, [supabase]);

  return (
    <section
      className={`rounded-2xl border px-4 py-3 sm:px-5 ${
        light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm font-semibold ${light ? "text-slate-900" : "text-white"}`}>{t.integrationsTitle}</p>
        <Link
          href="/dashboard/integrations"
          className={`text-xs font-semibold ${light ? "text-accent hover:underline" : "text-accent hover:underline"}`}
        >
          {t.navIntegrations}
        </Link>
      </div>
      <div className="mt-3">
        <Link href="/dashboard/integrations" className={pillClass(light, connected)}>
          {connected ? t.calendarBannerConnected : t.calendarBannerConnect}
        </Link>
      </div>
    </section>
  );
}
