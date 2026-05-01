"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useLocale } from "@/app/locale-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getProfile, upsertProfile, type UserProfile } from "@/lib/profile";
import {
  getBillingRecords,
  getBillingTotalCents,
  getCurrentSubscription,
  getPlanMeta,
  type BillingRecord,
  type UserSubscription,
} from "@/lib/subscriptions";
import { WorkspacesSettings } from "@/app/settings/workspaces-settings";
import { AccountTeamSettings } from "@/app/settings/account-team-settings";
import type { PlanId } from "@/lib/plans";
import { useWorkspace } from "@/app/workspace-context";
import { getReminderRule, normalizeDaysAfterDue, upsertReminderRule } from "@/lib/reminder-rules";

const currency = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

type ProfileForm = Omit<UserProfile, "userId">;

function emptyProfile(locale: "fr" | "en"): ProfileForm {
  return {
    fullName: "",
    companyName: "",
    phone: "",
    address: "",
    country: "",
    language: locale,
    autoRemindersEnabled: true,
    activeWorkspaceId: null,
  };
}

export default function SettingsPage() {
  const { locale, setLocale } = useLocale();
  const { user, loading, isAuthenticated, signOut } = useAuth();
  const ws = useWorkspace();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [profile, setProfile] = useState<ProfileForm>(emptyProfile(locale));
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [billing, setBilling] = useState<BillingRecord[]>([]);
  const [pageError, setPageError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [autoRuleEnabled, setAutoRuleEnabled] = useState(true);
  const [autoRuleDays, setAutoRuleDays] = useState<number[]>([3, 7, 21]);
  const [autoRuleMax, setAutoRuleMax] = useState(50);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [ruleMessage, setRuleMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router, user]);

  useEffect(() => {
    if (!user || !supabase) return;
    let mounted = true;

    void Promise.all([
      getProfile(supabase, user.id),
      getCurrentSubscription(supabase, user.id),
      getBillingRecords(supabase, user.id),
    ])
      .then(([profileData, subscriptionData, billingData]) => {
        if (!mounted) return;
        setPageError(null);
        if (profileData) {
          setProfile({
            fullName: profileData.fullName,
            companyName: profileData.companyName,
            phone: profileData.phone,
            address: profileData.address,
            country: profileData.country,
            language: profileData.language,
            autoRemindersEnabled: profileData.autoRemindersEnabled,
            activeWorkspaceId: profileData.activeWorkspaceId,
          });
        }
        setSubscription(subscriptionData);
        setBilling(billingData);
      })
      .catch((e) => {
        if (!mounted) return;
        const message = e instanceof Error ? e.message : "Impossible de charger les paramètres.";
        setPageError(message);
      });

    return () => {
      mounted = false;
    };
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase || !user?.id || !ws.activeWorkspaceId || !ws.ready) return;
    let cancelled = false;
    void (async () => {
      try {
        const rule = await getReminderRule(supabase, ws.activeWorkspaceId!);
        if (cancelled || !rule) return;
        setAutoRuleEnabled(rule.enabled);
        setAutoRuleDays(normalizeDaysAfterDue(rule.daysAfterDue));
        setAutoRuleMax(rule.maxJobsPerRun);
      } catch {
        // table may not be migrated yet
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user?.id, ws.activeWorkspaceId, ws.ready]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    if (!supabase || !user) return;
    setSavingProfile(true);
    try {
      await upsertProfile(supabase, { userId: user.id, ...profile });
      setLocale(profile.language);
      setProfileMessage(locale === "fr" ? "Profil mis à jour." : "Profile updated.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Mise à jour impossible.";
      setProfileMessage(message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordMessage(null);
    if (!supabase) return;
    if (password.length < 8) {
      setPasswordMessage(locale === "fr" ? "Le mot de passe doit contenir 8 caractères minimum." : "Password must be at least 8 characters.");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setPasswordMessage(error.message);
        return;
      }
      setPassword("");
      setPasswordMessage(locale === "fr" ? "Mot de passe mis à jour." : "Password updated.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSignOut() {
    setLoggingOut(true);
    const { error } = await signOut();
    setLoggingOut(false);
    if (!error) {
      router.push("/");
      return;
    }
    setPageError(error);
  }

  const scheduleChipDays = [1, 3, 7, 21] as const;

  function toggleRuleDay(day: number) {
    setAutoRuleDays((prev) => {
      const has = prev.includes(day);
      const next = has ? prev.filter((v) => v !== day) : [...prev, day];
      return next.sort((a, b) => a - b);
    });
  }

  function applySchedulePreset(days: number[]) {
    setAutoRuleDays(normalizeDaysAfterDue(days));
  }

  async function handleSaveAutomationRule(e: React.FormEvent) {
    e.preventDefault();
    setRuleMessage(null);
    if (!supabase || !user?.id || !ws.activeWorkspaceId) return;
    if (autoRuleDays.length === 0) {
      setRuleMessage(locale === "fr" ? "Choisissez au moins un délai." : "Pick at least one schedule day.");
      return;
    }
    setRuleSaving(true);
    try {
      await upsertReminderRule(supabase, {
        workspaceId: ws.activeWorkspaceId,
        ownerUserId: user.id,
        enabled: autoRuleEnabled,
        timezone: "Europe/Paris",
        daysAfterDue: normalizeDaysAfterDue(autoRuleDays),
        maxJobsPerRun: Math.max(1, Math.min(500, autoRuleMax)),
      });
      setAutoRuleDays(normalizeDaysAfterDue(autoRuleDays));
      setRuleMessage(locale === "fr" ? "Règles automatiques mises à jour." : "Automation rules updated.");
    } catch (e) {
      setRuleMessage(e instanceof Error ? e.message : locale === "fr" ? "Mise à jour impossible." : "Update failed.");
    } finally {
      setRuleSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Chargement des paramètres…</div>
      </main>
    );
  }

  const planMeta = getPlanMeta(subscription?.planId ?? "free");
  const totalSpent = getBillingTotalCents(billing);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Account settings</p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {locale === "fr" ? "Paramètres client" : "Customer settings"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Dashboard
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loggingOut}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loggingOut ? "..." : locale === "fr" ? "Se déconnecter" : "Log out"}
          </button>
        </div>
      </header>

      {pageError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {pageError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">{locale === "fr" ? "Profil et données personnelles" : "Profile and personal data"}</h2>
          <form onSubmit={handleSaveProfile} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{locale === "fr" ? "Nom" : "Name"}</span>
              <input
                type="text"
                value={profile.fullName}
                onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{locale === "fr" ? "Société" : "Company"}</span>
              <input
                type="text"
                value={profile.companyName}
                onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{locale === "fr" ? "Téléphone" : "Phone"}</span>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{locale === "fr" ? "Adresse" : "Address"}</span>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{locale === "fr" ? "Pays" : "Country"}</span>
              <input
                type="text"
                value={profile.country}
                onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{locale === "fr" ? "Langue" : "Language"}</span>
              <select
                value={profile.language}
                onChange={(e) => setProfile((p) => ({ ...p, language: e.target.value as "fr" | "en" }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {locale === "fr" ? "Relances automatiques" : "Automatic reminders"}
              </span>
              <div className="mt-2 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <input
                  id="auto-reminders-enabled"
                  type="checkbox"
                  checked={profile.autoRemindersEnabled}
                  onChange={(e) => setProfile((p) => ({ ...p, autoRemindersEnabled: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="auto-reminders-enabled" className="text-sm text-slate-700">
                  {locale === "fr"
                    ? "Autoriser le scheduler à envoyer les relances planifiées."
                    : "Allow the scheduler to send planned reminder emails."}
                </label>
              </div>
            </label>
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{user.email}</p>
            </div>
            {profileMessage && (
              <p className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">{profileMessage}</p>
            )}
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {savingProfile ? "..." : locale === "fr" ? "Mettre à jour mes infos" : "Update my profile"}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">{locale === "fr" ? "Abonnement" : "Subscription"}</h2>
            <p className="mt-3 text-sm text-slate-600">{planMeta.name}</p>
            <p className="mt-1 text-sm text-slate-600">{subscription?.status ?? "trial"}</p>
            <p className="mt-1 text-sm text-slate-600">
              {currency.format((subscription?.amountCents ?? 0) / 100)} / {locale === "fr" ? "mois" : "month"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {locale === "fr" ? "Renouvellement" : "Renewal"}:{" "}
              {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : "-"}
            </p>
            <p className="mt-3 text-sm font-medium text-slate-900">
              {locale === "fr" ? "Total dépensé" : "Total spent"}: {currency.format(totalSpent / 100)}
            </p>
            <Link href="/#pricing" className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              {locale === "fr" ? "Gérer l’abonnement" : "Manage subscription"}
            </Link>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-semibold text-slate-900">{locale === "fr" ? "Sécurité" : "Security"}</h2>
            <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-slate-500">{locale === "fr" ? "Nouveau mot de passe" : "New password"}</span>
                <input
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </label>
              {passwordMessage && <p className="text-sm text-slate-700">{passwordMessage}</p>}
              <button
                type="submit"
                disabled={changingPassword}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {changingPassword ? "..." : locale === "fr" ? "Changer le mot de passe" : "Change password"}
              </button>
            </form>
          </section>
        </aside>
      </div>

      {supabase && user ? (
        <div className="mt-8 space-y-8">
          <WorkspacesSettings
            supabase={supabase}
            userId={user.id}
            planId={(subscription?.planId ?? "free") as PlanId}
            locale={locale}
          />
          <AccountTeamSettings supabase={supabase} planId={(subscription?.planId ?? "free") as PlanId} />
        </div>
      ) : null}

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">{locale === "fr" ? "Facturation récente" : "Recent billing"}</h2>
        {billing.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            {locale === "fr" ? "Aucune transaction pour le moment (source: table billing_records)." : "No transactions yet (source: billing_records table)."}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {billing.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span>{new Date(entry.paidAt).toLocaleDateString()}</span>
                <span>{currency.format(entry.amountCents / 100)}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{entry.status}</span>
                <span className="text-xs text-slate-500">{entry.provider}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-semibold text-slate-900">{locale === "fr" ? "Relances automatiques (scheduler)" : "Automatic reminders (scheduler)"}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {locale === "fr"
            ? "Ces paramètres pilotent le runner serveur /api/reminders/run pour le portefeuille actif."
            : "These settings drive the server runner /api/reminders/run for the active workspace."}
        </p>
        <form onSubmit={handleSaveAutomationRule} className="mt-4 space-y-4">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={autoRuleEnabled} onChange={(e) => setAutoRuleEnabled(e.target.checked)} />
            {locale === "fr" ? "Activer l'automatisation" : "Enable automation"}
          </label>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {locale === "fr" ? "Jours après échéance" : "Days after due date"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {locale === "fr" ? (
                <>
                  Calendrier côté serveur en jour UTC (<code className="rounded bg-slate-100 px-1">scheduled_for</code> à{" "}
                  <code className="rounded bg-slate-100 px-1">08:00 UTC</code>). Exemple : avec <strong>J+1</strong>, une facture dont{" "}
                  <code className="rounded bg-slate-100 px-1">due_date</code> est <strong>aujourd’hui UTC</strong> peut être mise en file le{" "}
                  <strong>lendemain</strong>, puis envoyée après ce créneau (cron quotidien ou appel manuel à{" "}
                  <code className="rounded bg-slate-100 px-1">/api/reminders/run</code>).
                </>
              ) : (
                <>
                  Runner uses UTC dates (<code className="rounded bg-slate-100 px-1">scheduled_for</code> at{" "}
                  <code className="rounded bg-slate-100 px-1">08:00 UTC</code>). Example: with <strong>J+1</strong>, if{" "}
                  <code className="rounded bg-slate-100 px-1">due_date</code> is <strong>today UTC</strong>, enqueue happens the{" "}
                  <strong>next day</strong>, then email sends after that window—via daily cron or a manual GET to{" "}
                  <code className="rounded bg-slate-100 px-1">/api/reminders/run</code>.
                </>
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applySchedulePreset([3, 7, 21])}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {locale === "fr" ? "Préréglage : J+3 · 7 · 21" : "Preset: J+3 · 7 · 21"}
              </button>
              <button
                type="button"
                onClick={() => applySchedulePreset([1, 3, 7, 21])}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {locale === "fr" ? "Préréglage : J+1 · 3 · 7 · 21" : "Preset: J+1 · 3 · 7 · 21"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={locale === "fr" ? "Délais par relance" : "Reminder delays"}>
              {scheduleChipDays.map((day) => {
                const selected = autoRuleDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleRuleDay(day)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? "border-blue-500 bg-blue-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    J+{day}
                  </button>
                );
              })}
            </div>
          </div>
          <label className="block text-sm text-slate-700">
            {locale === "fr" ? "Maximum d’envois par run" : "Max sends per run"}
            <input
              type="number"
              min={1}
              max={500}
              value={autoRuleMax}
              onChange={(e) => setAutoRuleMax(Number.parseInt(e.target.value, 10) || 1)}
              className="mt-1 w-32 rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          {ruleMessage ? <p className="text-sm text-slate-700">{ruleMessage}</p> : null}
          <button
            type="submit"
            disabled={ruleSaving || !ws.activeWorkspaceId}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {ruleSaving ? "..." : locale === "fr" ? "Enregistrer les règles" : "Save automation rules"}
          </button>
        </form>
      </section>
    </main>
  );
}
