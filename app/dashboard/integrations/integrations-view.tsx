"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/auth-context";
import { useLocale } from "@/app/locale-context";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { useResolvedUiAppearance } from "@/lib/ui-theme";
import { getDashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getCurrentSubscription, type UserSubscription } from "@/lib/subscriptions";
import { useWorkspace } from "@/app/workspace-context";
import { readCustomCalendarEvents, type CustomCalendarEvent } from "@/lib/organization-calendar";
import { IntegrationBrandIcon } from "./integration-brand-icon";

type CalendarStatus = {
  configured: boolean;
  connected: boolean;
  lastSyncAt: string | null;
};

export function IntegrationsView() {
  const { locale } = useLocale();
  const { user, signOut } = useAuth();
  const ws = useWorkspace();
  const searchParams = useSearchParams();
  const appearance = useResolvedUiAppearance();
  const light = appearance === "light";
  const t = getDashboardHomeCopy(locale);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [plan, setPlan] = useState<UserSubscription | null>(null);
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [busy, setBusy] = useState<"connect" | "disconnect" | "sync" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  /** Variables Calendar lues côté serveur uniquement : via /status (pas process.env dans le client). */
  const connectEnabled = status?.configured ?? false;
  const statusLoaded = status !== null;

  const loadStatus = useCallback(async () => {
    if (!supabase) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;
    const res = await fetch("/api/integrations/google-calendar/status", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) {
      setStatus({ configured: false, connected: false, lastSyncAt: null });
      return;
    }
    const json = (await res.json()) as CalendarStatus & { ok?: boolean };
    setStatus({
      configured: Boolean(json.configured),
      connected: Boolean(json.connected),
      lastSyncAt: json.lastSyncAt ?? null,
    });
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    const ownerId = ws.effectiveOwnerUserId ?? user.id;
    void getCurrentSubscription(supabase, ownerId).then(setPlan);
  }, [supabase, user?.id, ws.effectiveOwnerUserId]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const cal = searchParams.get("calendar");
    if (cal === "connected") {
      setToast(t.calendarConnectedToast);
      void loadStatus();
    } else if (cal === "error") {
      setToast(t.calendarConnectFailed);
    }
  }, [searchParams, t.calendarConnectedToast, t.calendarConnectFailed, loadStatus]);

  async function authHeaders(): Promise<HeadersInit | null> {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    return { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" };
  }

  async function handleConnect() {
    if (!connectEnabled) return;
    setBusy("connect");
    try {
      const headers = await authHeaders();
      if (!headers) {
        setToast(t.calendarConnectFailed);
        return;
      }
      const res = await fetch("/api/integrations/google-calendar/connect", { headers });
      const json = (await res.json()) as { ok?: boolean; url?: string };
      if (json.ok && json.url) {
        window.location.href = json.url;
        return;
      }
      setToast(t.calendarConnectFailed);
    } finally {
      setBusy(null);
    }
  }

  async function handleDisconnect() {
    setBusy("disconnect");
    try {
      const headers = await authHeaders();
      if (!headers) return;
      const res = await fetch("/api/integrations/google-calendar/disconnect", { method: "POST", headers });
      if (res.ok) {
        setStatus((s) => (s ? { ...s, connected: false, lastSyncAt: null } : s));
      }
      await loadStatus();
    } finally {
      setBusy(null);
    }
  }

  async function handleSync() {
    if (!user?.id || !ws.activeWorkspaceId) return;
    setBusy("sync");
    try {
      const headers = await authHeaders();
      if (!headers) return;
      const customEvents: CustomCalendarEvent[] = readCustomCalendarEvents(user.id, ws.activeWorkspaceId);
      const res = await fetch("/api/integrations/google-calendar/sync", {
        method: "POST",
        headers,
        body: JSON.stringify({
          workspaceId: ws.activeWorkspaceId,
          locale,
          customEvents,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; synced?: number; errors?: number };
      if (json.ok) {
        setToast(t.calendarSyncSuccess);
        await loadStatus();
      } else {
        setToast(t.calendarSyncFailed);
      }
    } finally {
      setBusy(null);
    }
  }

  const connected = status?.connected ?? false;
  const card = `rounded-2xl border p-6 ${light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"}`;

  return (
    <DashboardShell
      locale={locale}
      planId={plan?.planId ?? "free"}
      activeNav="overview"
      onNav={() => {}}
      navScrollMode={false}
      userEmail={user?.email}
      onLogout={() => void signOut()}
      appearance={appearance}
    >
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className={`text-2xl font-bold tracking-tight ${light ? "text-slate-900" : "text-white"}`}>
            {t.integrationsPageTitle}
          </h1>
          <p className={`mt-2 text-sm leading-relaxed ${light ? "text-slate-600" : "text-slate-400"}`}>
            {t.integrationsPageIntro}
          </p>
        </div>

        {toast ? (
          <p
            className={`rounded-xl border px-4 py-3 text-sm ${
              light ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
            }`}
            role="status"
          >
            {toast}
          </p>
        ) : null}

        <article className={card}>
          <div className="flex items-start gap-4">
            <IntegrationBrandIcon className="h-14 w-14" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className={`text-lg font-semibold ${light ? "text-slate-900" : "text-white"}`}>
                  {t.integrationsCalendarTitle}
                </h2>
                <span
                  className={
                    connected
                      ? light
                        ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
                        : "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-200"
                      : light
                        ? "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-600"
                        : "rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs font-medium text-slate-400"
                  }
                >
                  {connected ? t.calendarStatusConnected : t.calendarStatusNotConnected}
                </span>
              </div>
              <p className={`mt-3 text-sm leading-relaxed ${light ? "text-slate-600" : "text-slate-400"}`}>
                {t.integrationsCalendarBody}
              </p>
              {status?.lastSyncAt ? (
                <p className={`mt-2 text-xs ${light ? "text-slate-500" : "text-slate-500"}`}>
                  {t.calendarLastSync} : {new Date(status.lastSyncAt).toLocaleString(locale)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {!connected ? (
              <button
                type="button"
                disabled={!connectEnabled || busy !== null}
                onClick={() => void handleConnect()}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === "connect" ? t.calendarSyncing : t.calendarConnect}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy !== null || !ws.activeWorkspaceId}
                  onClick={() => void handleSync()}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy === "sync" ? t.calendarSyncing : t.calendarSyncNow}
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => void handleDisconnect()}
                  className={
                    light
                      ? "rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      : "rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.04]"
                  }
                >
                  {busy === "disconnect" ? t.calendarSyncing : t.calendarDisconnect}
                </button>
              </>
            )}
          </div>

          {statusLoaded && !connectEnabled ? (
            <p className={`mt-4 text-xs ${light ? "text-amber-800" : "text-amber-200"}`}>{t.calendarUnavailable}</p>
          ) : null}
        </article>

        <Link
          href="/dashboard"
          className={`inline-flex text-sm font-semibold ${light ? "text-slate-700 hover:text-slate-900" : "text-slate-300 hover:text-white"}`}
        >
          ← {t.navHome}
        </Link>
      </div>
    </DashboardShell>
  );
}
