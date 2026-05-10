"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { useWorkspace } from "@/app/workspace-context";
import { useLocale } from "@/app/locale-context";
import { AUTO_REMINDER_FROM_DISPLAY } from "@/lib/auto-reminder-copy";
import { listReminderEmailTemplates, type ReminderEmailTemplate } from "@/lib/reminder-email-templates";
import { getReminderRule } from "@/lib/reminder-rules";
import {
  getMaxEmailTemplates,
  hasReminderTemplatesEditor,
  canUseTemplatePaymentLink,
  getMaxReminderJobsPerRun,
  REMINDER_JOBS_PER_RUN_DEFAULT,
  type PlanId,
} from "@/lib/plans";
import { getCurrentSubscription, type UserSubscription } from "@/lib/subscriptions";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { REMINDER_TEMPLATE_VARIABLES_DOC } from "@/lib/reminder-template-substitution";
import {
  resolveUiTheme,
  readStoredUiThemePreference,
  subscribeUiThemePreferenceChange,
  usePrefersColorSchemeDark,
  type UiThemePreference,
} from "@/lib/ui-theme";

export function AutoRemindersRegistryView() {
  const { locale } = useLocale();
  const { signOut, user } = useAuth();
  const ws = useWorkspace();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [plan, setPlan] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [ruleEnabled, setRuleEnabled] = useState<boolean | null>(null);
  const [ruleMaxJobs, setRuleMaxJobs] = useState<number | null>(null);
  const [templates, setTemplates] = useState<ReminderEmailTemplate[]>([]);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const systemDark = usePrefersColorSchemeDark();
  const [uiThemePref, setUiThemePref] = useState<UiThemePreference>(() => readStoredUiThemePreference() ?? "light");
  const shellAppearance = useMemo(() => (resolveUiTheme(uiThemePref, systemDark) === "light" ? "light" : "dark"), [
    uiThemePref,
    systemDark,
  ]);

  const planId = (plan?.planId ?? "free") as PlanId;
  const memberReadOnly = Boolean(supabase) && ws.isActingAsMember && ws.memberRoleOnEffectiveAccount === "member";
  const allowed = hasReminderTemplatesEditor(planId);
  const maxTpl = getMaxEmailTemplates(planId);
  const allowPayLink = canUseTemplatePaymentLink(planId);
  const planJobsCap = getMaxReminderJobsPerRun(planId);

  const workspaceKey = useMemo(() => {
    if (!supabase) return null;
    if (!ws.ready || !ws.activeWorkspaceId) return null;
    return ws.activeWorkspaceId;
  }, [supabase, ws.ready, ws.activeWorkspaceId]);
  const workspaceWait = Boolean(supabase && allowed && workspaceKey === null);

  const refreshPlan = useCallback(async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          router.replace("/login");
          return;
        }
        const billUserId = ws.effectiveOwnerUserId ?? auth.user.id;
        const sub = await getCurrentSubscription(supabase, billUserId);
        setPlan(sub);
      } else {
        setPlan({
          planId: "free",
          status: "trial",
          amountCents: 0,
          currency: "EUR",
          currentPeriodEnd: null,
          billingInterval: null,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [router, supabase, ws.effectiveOwnerUserId]);

  useEffect(() => subscribeUiThemePreferenceChange((pref) => setUiThemePref(pref)), []);
  useEffect(() => void refreshPlan(), [refreshPlan]);

  const wsId = workspaceKey ?? null;
  useEffect(() => {
    if (!allowed || memberReadOnly || !supabase || !wsId) return;
    let cancelled = false;
    void (async () => {
      setLoadErr(null);
      try {
        const [rule, tpls] = await Promise.all([getReminderRule(supabase, wsId), listReminderEmailTemplates(supabase, wsId)]);
        if (cancelled) return;
        setRuleEnabled(rule?.enabled ?? true);
        setRuleMaxJobs(rule?.maxJobsPerRun ?? REMINDER_JOBS_PER_RUN_DEFAULT);
        const sorted = [...tpls].sort((a, b) => a.sortOrder - b.sortOrder || a.daysAfterDue - b.daysAfterDue);
        setTemplates(sorted);
      } catch (e) {
        if (!cancelled) setLoadErr(e instanceof Error ? e.message : "Load failed");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [allowed, memberReadOnly, supabase, wsId]);

  async function handleLogout() {
    const { error } = await signOut();
    if (!error) router.push("/");
  }

  const t =
    locale === "fr"
      ? {
          pageTitle: "Enregistrement des relances automatiques",
          back: "Modèles de relance",
          intro:
            "Cette page reprend fidèlement ce que vous avez enregistré pour le portefeuille actif — ce sont les messages que PayPulss enverra vraiment (objet et corps avec les variables telles que stockées dans la base).",
          automationState: "Relances automatiques",
          automationOn: "Activées.",
          automationOff: "Pour l’instant désactivées (case à cocher sur la page de configuration). Les modèles restent conservés tant que vous les supprimez pas.",
          fromLine: `Expéditeur habituel vu par vos clients : ${AUTO_REMINDER_FROM_DISPLAY} (Réglé côté serveur.)`,
          jExpl: (j: number) =>
            `Délai J+${j} : envoyé quand une facture est impayée et que la date d’échéance + ${j} jour(s) est atteinte (jour calendaire défini dans PayPulss, calcul serveur puis envoi généralement le matin).`,
          subject: "Objet enregistré",
          body: "Corps enregistré (variables non remplies ici)",
          tplLimit: `Votre plan accepte jusqu’à ${maxTpl} modèle(s).`,
          payHtml: allowPayLink
            ? "Votre plan peut ajouter un lien de paiement distinct (affiché cliquable en bas du mail HTML)."
            : "Plan Starter : pas de champ lien-bouton — texte brut côté expédition (copier-coller des URL dans le corps).",
          vars: "Variables encore à remplacer à l’envoi :",
          varsList: REMINDER_TEMPLATE_VARIABLES_DOC.join(", "),
          emptyTemplates: "Aucun modèle enregistré pour ce portefeuille.",
          workspaceWait: "Sélectionnez un portefeuille.",
          loading: "Chargement…",
          loadErrPrefix: "Impossible de lire vos modèles :",
          upgradeTitle: "Fonction Starter et plus",
          upgradeBody:
            "Passez au plan Starter ou supérieur pour activer cette synthèse. Le plan gratuit n’a pas encore de relances auto paramétrables.",
          upgradeCta: "Voir les offres",
          readonlyNotice: "Lecture seule : connecté en tant que membre invité.",
          batchTitle: "Plafond d’envois par passage",
          batchExplain: (saved: number, cap: number) => {
            const eff = Math.min(saved, cap);
            const tail =
              saved > cap
                ? ` (valeur sauvegardée ${saved}, mais votre plan limite désormais l’effet à ${cap} par passage jusqu’à prochain enregistrement.)`
                : "";
            return `Effectif après plafond de votre formule : ${eff}${tail}. À chaque passage du robot (cron), PayPulss n’envoie pas plus que ce nombre de relances automatiques pour ce portefeuille avant l’exécution suivante. C’est utile si beaucoup de factures sautent en retard en même temps : pas de tsunami d’e-mails, moins de risque côté quota Resend, charge serveur raisonnable. Plafond max du plan : ${cap}.`;
          },
        }
      : {
          pageTitle: "Scheduled automatic reminders — saved copy",
          back: "Reminder templates",
          intro:
            "This page mirrors exactly what PayPulss will send from the automation engine for your active workspace (stored subject/body placeholders). Manual drafts are not listed here.",
          automationState: "Automation state",
          automationOn: "Enabled.",
          automationOff: "Disabled on the scheduler form right now — saved templates remain until deleted.",
          fromLine: `Default visible sender line: ${AUTO_REMINDER_FROM_DISPLAY} (configured server-side).`,
          jExpl: (j: number) =>
            `Schedule J+${j}: sends when an unpaid row is overdue and due date plus ${j} calendar day(s) has been reached—then dispatched on the runner’s UTC window (usually mid-morning Paris).`,
          subject: "Saved subject template",
          body: "Saved body template",
          tplLimit: `Your plan accepts up to ${maxTpl} template(s).`,
          payHtml: allowPayLink ? "Adds optional HTML footer link field for payment URLs." : "Starter sends plain-text auto reminders — paste URLs manually in the body if needed.",
          vars: "Server fills these placeholders at send time:",
          varsList: REMINDER_TEMPLATE_VARIABLES_DOC.join(", "),
          emptyTemplates: "No templates saved yet for this workspace.",
          workspaceWait: "Pick a workspace first.",
          loading: "Loading…",
          loadErrPrefix: "Could not read templates:",
          upgradeTitle: "Starter and up",
          upgradeBody: "Upgrade from Free to Starter+ to unlock automatic reminder registration.",
          upgradeCta: "View plans",
          readonlyNotice: "Read-only workspace member.",
          batchTitle: "Max sends per cron run",
          batchExplain: (saved: number, cap: number) => {
            const eff = Math.min(saved, cap);
            const tail =
              saved > cap ? ` Stored value ${saved}; your plan currently limits each run to ${cap} until you resave.` : "";
            return `Effective per-run cap after plan limits: ${eff}.${tail} Each cron pass sends at most this many automated reminders for this wallet before pausing until the next run—helpful bursts control, tighter Resend quotas, lighter server workloads. Hard plan max: ${cap}.`;
          },
        };

  const muted = shellAppearance === "light" ? "text-slate-600" : "text-slate-400";
  const cardBg = shellAppearance === "light" ? "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" : "rounded-2xl border border-white/[0.08] bg-[#14141c] p-5";

  if (loading || workspaceWait) {
    return (
      <DashboardShell
        locale={locale}
        planId={planId}
        activeNav="overview"
        navScrollMode={false}
        onNav={() => router.push("/dashboard")}
        userEmail={user?.email}
        onLogout={handleLogout}
        hideTrashNav={memberReadOnly}
        appearance={shellAppearance}
      >
        <p className={`text-sm ${muted}`}>{t.loading}</p>
      </DashboardShell>
    );
  }

  if (!allowed) {
    return (
      <DashboardShell
        locale={locale}
        planId={planId}
        activeNav="overview"
        navScrollMode={false}
        onNav={() => router.push("/dashboard")}
        userEmail={user?.email}
        onLogout={handleLogout}
        hideTrashNav={memberReadOnly}
        appearance={shellAppearance}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className={`text-xl font-bold ${shellAppearance === "light" ? "text-slate-900" : "text-white"}`}>{t.pageTitle}</h2>
            <Link
              href="/dashboard/modeles-relance"
              className={
                shellAppearance === "light" ? "text-sm font-medium text-violet-700 hover:text-violet-600" : "text-sm font-medium text-violet-300"
              }
            >
              ← {t.back}
            </Link>
          </div>
          <div className={shellAppearance === "light" ? "rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm" : "rounded-2xl border border-amber-500/30 bg-amber-950/25 p-6 text-sm"}>
            <p className="font-semibold">{t.upgradeTitle}</p>
            <p className="mt-2 opacity-95">{t.upgradeBody}</p>
            <Link href="/#pricing" className="mt-4 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500">
              {t.upgradeCta}
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (!wsId && supabase) {
    return (
      <DashboardShell
        locale={locale}
        planId={planId}
        activeNav="overview"
        navScrollMode={false}
        onNav={() => router.push("/dashboard")}
        userEmail={user?.email}
        onLogout={handleLogout}
        hideTrashNav={memberReadOnly}
        appearance={shellAppearance}
      >
        <p className={`text-sm ${muted}`}>{t.workspaceWait}</p>
      </DashboardShell>
    );
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
      hideTrashNav={memberReadOnly}
      appearance={shellAppearance}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className={`text-xl font-bold ${shellAppearance === "light" ? "text-slate-900" : "text-white"}`}>{t.pageTitle}</h2>
          <Link
            href="/dashboard/modeles-relance"
            className={
              shellAppearance === "light" ? "text-sm font-medium text-violet-700 hover:text-violet-600" : "text-sm font-medium text-violet-300"
            }
          >
            ← {t.back}
          </Link>
        </div>

        {memberReadOnly ? (
          <p className={`text-sm ${shellAppearance === "light" ? "text-amber-800" : "text-amber-200"}`}>{t.readonlyNotice}</p>
        ) : null}

        <p className={`text-sm leading-relaxed ${muted}`}>{t.intro}</p>
        <div className={cardBg}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${shellAppearance === "light" ? "text-slate-500" : "text-slate-400"}`}>
            {t.automationState}
          </p>
          <p className={`mt-2 text-sm leading-relaxed ${shellAppearance === "light" ? "text-slate-800" : "text-slate-200"}`}>
            {ruleEnabled === false ? t.automationOff : t.automationOn}
          </p>
          <p className={`mt-3 text-sm ${muted}`}>{t.fromLine}</p>
          <p className={`mt-3 text-xs leading-relaxed ${muted}`}>{t.tplLimit}</p>
          <p className={`mt-2 text-xs leading-relaxed ${muted}`}>{t.payHtml}</p>
          <p className={`mt-2 text-xs leading-relaxed ${muted}`}>
            <span className="font-semibold">{t.vars}</span> {t.varsList}
          </p>
          {!allowPayLink ? (
            <p className={`mt-3 text-[11px] leading-relaxed ${muted}`}>
              {locale === "fr"
                ? "Plan Starter — PayPulss n’envoie pas la version HTML automatique pour ces relances (pas de lien-bouton généré par le produit)."
                : "Starter plan — PayPulss sends plain-text auto reminders here (no product-generated HTML/link button)."}
            </p>
          ) : null}
          {ruleMaxJobs != null ? (
            <div className={`mt-4 border-t pt-4 ${shellAppearance === "light" ? "border-slate-200" : "border-white/[0.08]"}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-wide ${shellAppearance === "light" ? "text-slate-500" : "text-slate-400"}`}>{t.batchTitle}</p>
              <p className={`mt-2 text-sm leading-relaxed ${shellAppearance === "light" ? "text-slate-800" : "text-slate-200"}`}>
                {t.batchExplain(ruleMaxJobs, planJobsCap)}
              </p>
            </div>
          ) : null}
        </div>

        {loadErr ? (
          <p className="text-sm text-red-600">
            {t.loadErrPrefix} {loadErr}
          </p>
        ) : templates.length === 0 ? (
          <p className={`text-sm ${muted}`}>{t.emptyTemplates}</p>
        ) : (
          <div className="space-y-4">
            {templates.map((tpl) => (
              <article key={tpl.id} className={cardBg}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide ${shellAppearance === "light" ? "bg-blue-100 text-blue-900" : "bg-blue-500/20 text-blue-100"}`}
                  >
                    J+{tpl.daysAfterDue}
                  </span>
                </div>
                <p className={`mt-3 text-xs leading-relaxed ${muted}`}>{t.jExpl(tpl.daysAfterDue)}</p>
                <div className="mt-4 space-y-2">
                  <p className={`text-[11px] font-semibold uppercase tracking-wide ${shellAppearance === "light" ? "text-slate-500" : "text-slate-400"}`}>
                    {t.subject}
                  </p>
                  <p className={`whitespace-pre-wrap rounded-lg border border-slate-200/60 bg-black/5 px-3 py-2 font-mono text-sm ${shellAppearance === "light" ? "text-slate-900" : "border-white/10 bg-black/35 text-slate-100"}`}>
                    {tpl.subjectTemplate.trim() || "(–)"}
                  </p>
                </div>
                <div className="mt-3 space-y-2">
                  <p className={`text-[11px] font-semibold uppercase tracking-wide ${shellAppearance === "light" ? "text-slate-500" : "text-slate-400"}`}>{t.body}</p>
                  <pre
                    className={`max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200/60 px-3 py-2 font-sans text-sm leading-relaxed ${shellAppearance === "light" ? "bg-slate-50 text-slate-800" : "border-white/10 bg-black/35 text-slate-100"}`}
                  >
                    {tpl.bodyTemplate.trim() || "(–)"}
                  </pre>
                </div>
                {tpl.paymentLink?.trim() && allowPayLink ? (
                  <p className={`mt-3 break-all text-xs ${muted}`}>
                    {locale === "fr" ? "Lien de paiement enregistré :" : "Saved payment link:"} {tpl.paymentLink.trim()}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
