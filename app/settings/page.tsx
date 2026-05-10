"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useLocale } from "@/app/locale-context";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { getProfile, upsertProfile, type UserProfile } from "@/lib/profile";
import {
  billingRecordsWithSubscriptionSnapshot,
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
import { writeStoredUiThemePreference } from "@/lib/ui-theme";

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
    uiTheme: "light",
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
  const [portalLoading, setPortalLoading] = useState(false);

  const openStripePortal = useCallback(async () => {
    if (!supabase) return;
    setPortalLoading(true);
    setPageError(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) return;
      const returnUrl =
        typeof window !== "undefined" && window.location?.origin
          ? `${window.location.origin}/settings`
          : "/settings";
      const res = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ returnUrl }),
      });
      const j = (await res.json()) as { url?: string; error?: string };
      if (res.ok && typeof j.url === "string" && j.url.length > 0) {
        window.location.href = j.url;
        return;
      }
      setPageError(
        j.error ??
          (locale === "fr"
            ? "Portail Stripe indisponible. Active le portail client dans Stripe : Paramètres → Portail client."
            : "Stripe portal unavailable. Enable the customer portal under Stripe Settings → Customer portal."),
      );
    } finally {
      setPortalLoading(false);
    }
  }, [supabase, locale]);

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
            uiTheme: profileData.uiTheme,
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
    if (!supabase || !user) return;
    if (!subscription || subscription.planId === "free") return;
    if (subscription.currentPeriodEnd) return;

    let mounted = true;
    void (async () => {
      try {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (!token) return;
        const res = await fetch("/api/stripe/subscription-sync", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || !mounted) return;
        const j = (await res.json()) as { currentPeriodEnd?: string | null };
        if (!mounted || typeof j.currentPeriodEnd !== "string") return;
        const end = j.currentPeriodEnd;
        setSubscription((prev) => (prev ? { ...prev, currentPeriodEnd: end } : prev));
      } catch {
        /* ignore */
      }
    })();

    return () => {
      mounted = false;
    };
  }, [supabase, user, subscription?.planId, subscription?.currentPeriodEnd]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMessage(null);
    if (!supabase || !user) return;
    setSavingProfile(true);
    try {
      await upsertProfile(supabase, { userId: user.id, ...profile });
      writeStoredUiThemePreference(profile.uiTheme);
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

  if (loading || !user) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Chargement des paramètres…</div>
      </main>
    );
  }

  const planMeta = getPlanMeta(subscription?.planId ?? "free");
  const billingForDisplay = useMemo(
    () => billingRecordsWithSubscriptionSnapshot(billing, subscription),
    [billing, subscription],
  );
  const totalSpent = useMemo(() => getBillingTotalCents(billingForDisplay), [billingForDisplay]);

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
                {locale === "fr" ? "Apparence (tableau de bord)" : "Dashboard appearance"}
              </span>
              <select
                value={profile.uiTheme}
                onChange={(e) => {
                  const next = e.target.value as "dark" | "light" | "system";
                  setProfile((p) => ({ ...p, uiTheme: next }));
                  writeStoredUiThemePreference(next);
                }}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="light">{locale === "fr" ? "Mode clair" : "Light mode"}</option>
                <option value="dark">{locale === "fr" ? "Mode sombre" : "Dark mode"}</option>
                <option value="system">{locale === "fr" ? "Selon l’appareil" : "Match device"}</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                {locale === "fr"
                  ? "S’applique au menu et à l’arrière-plan du dashboard. Les relances automatiques se configurent sous Modèles de relance."
                  : "Applies to the dashboard shell and background. Automatic reminders are configured under Reminder templates."}
              </p>
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
            <p className="mt-1 text-xs text-slate-500">
              {locale === "fr"
                ? "Somme de toutes les lignes ci-dessous (plusieurs paiements ou tests peuvent dépasser un seul mois)."
                : "Sum of all rows below (several charges or tests can exceed a single month)."}
            </p>
            {subscription && subscription.planId !== "free" ? (
              <button
                type="button"
                onClick={() => void openStripePortal()}
                disabled={portalLoading}
                className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {portalLoading ? "…" : locale === "fr" ? "Gérer ou annuler l’abonnement (Stripe)" : "Manage or cancel (Stripe)"}
              </button>
            ) : (
              <Link
                href="/#pricing"
                className="mt-4 inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                {locale === "fr" ? "Voir les offres" : "View plans"}
              </Link>
            )}
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
        {billing.length === 0 && billingForDisplay.length > 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            {locale === "fr"
              ? "Aperçu depuis ton abonnement Stripe. Une ligne détaillée par transaction apparaîtra ici une fois le webhook enregistré."
              : "Snapshot from your Stripe subscription. Per-transaction rows appear here after the webhook runs."}
          </p>
        ) : null}
        {billingForDisplay.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            {locale === "fr"
              ? "Aucun paiement enregistré pour le moment. Après un achat Stripe, la ligne apparaît ici une fois le webhook reçu."
              : "No recorded payments yet. After a Stripe purchase, entries appear here once the webhook is received."}
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {billingForDisplay.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <span>
                  {entry.id === "__stripe_subscription_snapshot"
                    ? locale === "fr"
                      ? `Fin de période (estim.) ${new Date(entry.paidAt).toLocaleDateString("fr-FR")}`
                      : `Period end (est.) ${new Date(entry.paidAt).toLocaleDateString("en-US")}`
                    : new Date(entry.paidAt).toLocaleDateString()}
                </span>
                <span>{currency.format(entry.amountCents / 100)}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{entry.status}</span>
                <span className="text-xs text-slate-500">{entry.provider}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
