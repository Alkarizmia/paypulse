"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useLocale } from "@/app/locale-context";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import type { Client } from "@/app/dashboard/types";
import { OrganisationCalendar } from "@/app/dashboard/organisation/organisation-calendar";
import { fetchClients } from "@/lib/clients";
import { getActiveLocalClients } from "@/lib/local-clients";
import { intlLocaleFor } from "@/lib/app-locale";
import { getOrganizationCopy } from "@/lib/messages/organization-copy";
import {
  addCustomCalendarEvent,
  buildCalendarEventsFromClients,
  mergeCalendarEvents,
  readCustomCalendarEvents,
  removeCustomCalendarEvent,
  todayYmd,
  type CalendarEvent,
} from "@/lib/organization-calendar";
import { getProfile, type UserProfile } from "@/lib/profile";
import type { PlanId } from "@/lib/plans";
import { WorkspacesPanel } from "@/app/dashboard/workspaces-panel";
import { getCurrentSubscription } from "@/lib/subscriptions";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useResolvedUiAppearance } from "@/lib/ui-theme";
import { useWorkspace } from "@/app/workspace-context";

function addDaysYmd(ymd: string, days: number): string {
  const d = new Date(ymd + "T12:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function OrganisationView() {
  const { locale } = useLocale();
  const { signOut, user, loading: authLoading } = useAuth();
  const ws = useWorkspace();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const copy = getOrganizationCopy(locale);
  const appearance = useResolvedUiAppearance();
  const light = appearance === "light";

  const [clients, setClients] = useState<Client[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [planId, setPlanId] = useState<PlanId>("free");
  const [loading, setLoading] = useState(true);
  const [customVersion, setCustomVersion] = useState(0);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(todayYmd());
  const [eventNote, setEventNote] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (supabase && user?.id) {
        const billUserId = ws.effectiveOwnerUserId ?? user.id;
        const [prof, sub] = await Promise.all([
          getProfile(supabase, user.id),
          getCurrentSubscription(supabase, billUserId),
        ]);
        setProfile(prof);
        setPlanId(sub.planId);
        if (ws.ready && ws.activeWorkspaceId) {
          const list = await fetchClients(supabase, ws.activeWorkspaceId);
          setClients(list);
        } else {
          setClients([]);
        }
      } else {
        setClients(getActiveLocalClients());
        setPlanId("free");
        setProfile(null);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase, user?.id, ws.ready, ws.activeWorkspaceId, ws.effectiveOwnerUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/login");
  }, [authLoading, user, router]);

  const customEvents = useMemo(() => {
    if (!user?.id) return [];
    void customVersion;
    return readCustomCalendarEvents(user.id, ws.activeWorkspaceId);
  }, [user?.id, ws.activeWorkspaceId, customVersion]);

  const allEvents = useMemo((): CalendarEvent[] => {
    const fromClients = buildCalendarEventsFromClients(clients, {
      due: copy.dueLabel,
      payment: copy.paymentLabel,
      reminderSent: copy.reminderSentLabel,
      reminderPlanned: copy.reminderPlannedLabel,
    });
    return mergeCalendarEvents(fromClients, customEvents);
  }, [clients, customEvents, copy]);

  const upcoming = useMemo(() => {
    const start = todayYmd();
    const end = addDaysYmd(start, 14);
    return allEvents.filter((e) => e.date >= start && e.date <= end).slice(0, 12);
  }, [allEvents]);

  const monthLabel = useMemo(
    () => (year: number, month: number) =>
      new Intl.DateTimeFormat(intlLocaleFor(locale), { month: "long", year: "numeric" }).format(
        new Date(year, month, 1),
      ),
    [locale],
  );

  async function handleLogout() {
    const { error } = await signOut();
    if (!error) router.push("/");
  }

  function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id || !eventTitle.trim()) return;
    addCustomCalendarEvent(user.id, ws.activeWorkspaceId, {
      date: eventDate,
      title: eventTitle,
      note: eventNote,
    });
    setEventTitle("");
    setEventNote("");
    setCustomVersion((v) => v + 1);
  }

  const panel = light
    ? "rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
    : "rounded-2xl border border-white/[0.08] bg-[#14141c] p-4 sm:p-5";
  const head = light ? "text-slate-900" : "text-white";
  const muted = light ? "text-slate-600" : "text-slate-400";
  const input = light
    ? "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
    : "mt-1 w-full rounded-lg border border-white/10 bg-[#0f0f14] px-3 py-2 text-sm text-white";

  const orgLine = [profile?.companyName?.trim(), profile?.country?.trim()].filter(Boolean).join(" · ");

  return (
    <DashboardShell
      locale={locale}
      planId={planId}
      activeNav="overview"
      navScrollMode={false}
      onNav={() => router.push("/dashboard")}
      userEmail={user?.email}
      onLogout={handleLogout}
      hideTrashNav={ws.collaboratorNoClientMgmt}
      appearance={appearance}
    >
      <div className="space-y-6">
        <header>
          <h1 className={`text-xl font-bold tracking-tight ${head}`}>{copy.title}</h1>
          <p className={`mt-1 max-w-2xl text-sm ${muted}`}>{copy.subtitle}</p>
        </header>

        {loading ? (
          <p className={`text-sm ${muted}`}>{copy.loading}</p>
        ) : (
          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_min(18rem,22rem)]">
            <div className="min-w-0 space-y-6">
              <OrganisationCalendar
                events={allEvents}
                copy={copy}
                appearance={appearance}
                localeMonthLabel={monthLabel}
              />
            </div>

            <aside className="flex min-w-0 flex-col gap-4">
              <div className={panel}>
                <h2 className={`text-sm font-semibold ${head}`}>{copy.profileTitle}</h2>
                <p className={`mt-2 text-sm leading-relaxed ${muted}`}>
                  {profile?.fullName?.trim() || user?.email || "—"}
                  {orgLine ? (
                    <>
                      <br />
                      <span className="text-xs">{orgLine}</span>
                    </>
                  ) : null}
                </p>
                <Link
                  href="/settings#organization"
                  className={`mt-3 inline-flex text-xs font-semibold ${light ? "text-violet-700 hover:underline" : "text-violet-300 hover:underline"}`}
                >
                  {copy.editProfile}
                </Link>
              </div>

              <WorkspacesPanel locale={locale} appearance={appearance} variant="full" />

              <div className={panel}>
                <h2 className={`text-sm font-semibold ${head}`}>{copy.addEvent}</h2>
                <form onSubmit={handleAddEvent} className="mt-3 space-y-3">
                  <label className="block">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${muted}`}>{copy.eventTitle}</span>
                    <input
                      type="text"
                      value={eventTitle}
                      onChange={(e) => setEventTitle(e.target.value)}
                      className={input}
                      required
                      placeholder={locale === "fr" ? "Réunion, relance téléphonique…" : "Meeting, call…"}
                    />
                  </label>
                  <label className="block">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${muted}`}>{copy.eventDate}</span>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className={input}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${muted}`}>{copy.eventNote}</span>
                    <input
                      type="text"
                      value={eventNote}
                      onChange={(e) => setEventNote(e.target.value)}
                      className={input}
                    />
                  </label>
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500"
                  >
                    {copy.eventSave}
                  </button>
                </form>
              </div>

              <div className={panel}>
                <h2 className={`text-sm font-semibold ${head}`}>{copy.upcoming}</h2>
                {upcoming.length === 0 ? (
                  <p className={`mt-2 text-sm ${muted}`}>{copy.noUpcoming}</p>
                ) : (
                  <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
                    {upcoming.map((e) => (
                      <li
                        key={e.id}
                        className={`rounded-lg border px-2.5 py-2 ${
                          light ? "border-slate-100 bg-slate-50" : "border-white/[0.06] bg-white/[0.03]"
                        }`}
                      >
                        <p className={`text-[10px] tabular-nums ${muted}`}>{e.date}</p>
                        <p className={`font-medium ${head}`}>{e.title}</p>
                        {e.kind === "custom" && user?.id ? (
                          <button
                            type="button"
                            onClick={() => {
                              removeCustomCalendarEvent(user.id, ws.activeWorkspaceId, e.id);
                              setCustomVersion((v) => v + 1);
                            }}
                            className="mt-1 text-[10px] font-medium text-red-600 hover:underline dark:text-red-300"
                          >
                            {copy.eventDelete}
                          </button>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
