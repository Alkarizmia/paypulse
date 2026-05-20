"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useLocale } from "@/app/locale-context";
import { AccountTeamSettings } from "@/app/settings/account-team-settings";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { canAccessTeamPage, type PlanId } from "@/lib/plans";
import { getCurrentSubscription } from "@/lib/subscriptions";
import { getSupabaseBrowserClient, isSupabaseReady } from "@/lib/supabase";
import { useResolvedUiAppearance } from "@/lib/ui-theme";
import { useWorkspace } from "@/app/workspace-context";

export function EquipeView() {
  const { locale } = useLocale();
  const { signOut, user, loading: authLoading } = useAuth();
  const ws = useWorkspace();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const supabaseReady = isSupabaseReady();
  const [planId, setPlanId] = useState<PlanId>("free");
  const [loading, setLoading] = useState(true);
  const appearance = useResolvedUiAppearance();
  const light = appearance === "light";

  const refreshPlan = useCallback(async () => {
    if (!supabase || !user?.id) {
      setPlanId("free");
      setLoading(false);
      return;
    }
    try {
      const sub = await getCurrentSubscription(supabase, user.id);
      setPlanId(sub.planId);
    } catch {
      setPlanId("free");
    } finally {
      setLoading(false);
    }
  }, [supabase, user?.id]);

  useEffect(() => {
    void refreshPlan();
  }, [refreshPlan]);

  useEffect(() => {
    if (authLoading || loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!canAccessTeamPage(planId)) {
      router.replace("/dashboard");
    }
  }, [authLoading, loading, user, planId, router]);

  async function handleLogout() {
    const { error } = await signOut();
    if (!error) router.push("/");
  }

  const copy =
    locale === "fr"
      ? {
          title: "Équipe",
          sub: "Invitez des collaborateurs avec un rôle adapté. Pro : 1 siège équipe. Agency : 2 sièges.",
          upgrade:
            "L’équipe est disponible à partir du plan Pro. Passez à Pro ou Agency pour inviter des collaborateurs.",
          upgradeCta: "Voir les offres",
        }
      : locale === "nl"
        ? {
            title: "Team",
            sub: "Nodig collega’s uit met een passende rol. Pro: 1 persoon. Agency: 2 personen.",
            upgrade: "Teambeheer is beschikbaar vanaf Pro. Upgrade naar Pro of Agency.",
            upgradeCta: "Bekijk plannen",
          }
        : locale === "es"
          ? {
              title: "Equipo",
              sub: "Invite colaboradores con el rol adecuado. Pro: 1 persona. Agency: 2 personas.",
              upgrade: "El equipo está disponible desde Pro. Pase a Pro o Agency.",
              upgradeCta: "Ver planes",
            }
          : {
              title: "Team",
              sub: "Invite colleagues with the right role. Pro: 1 seat. Agency: 2 seats.",
              upgrade: "Team management starts on Pro. Upgrade to Pro or Agency.",
              upgradeCta: "View plans",
            };

  if (!canAccessTeamPage(planId) && !loading) {
    return null;
  }

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
        <div>
          <h1 className={`text-xl font-bold tracking-tight ${light ? "text-slate-900" : "text-white"}`}>{copy.title}</h1>
          <p className={`mt-1 text-sm ${light ? "text-slate-600" : "text-slate-400"}`}>{copy.sub}</p>
        </div>

        {loading ? (
          <p className={`text-sm ${light ? "text-slate-500" : "text-slate-400"}`}>
            {locale === "fr" ? "Chargement…" : "Loading…"}
          </p>
        ) : supabase && user ? (
          <AccountTeamSettings supabase={supabase} planId={planId} appearance={appearance} variant="dashboard" />
        ) : !supabaseReady ? (
          <div
            className={`rounded-2xl border p-6 text-sm ${
              light ? "border-slate-200 bg-white text-slate-600" : "border-white/[0.08] bg-[#14141c] text-slate-300"
            }`}
          >
            <p>{copy.upgrade}</p>
            <Link
              href="/#tarifs"
              className={`mt-4 inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                light ? "bg-violet-600 hover:bg-violet-700" : "bg-violet-600/90 hover:bg-violet-600"
              }`}
            >
              {copy.upgradeCta}
            </Link>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
