"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useWorkspace } from "@/app/workspace-context";
import { useLocale } from "@/app/locale-context";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import {
  clearReminderTemplates,
  getDefaultReminderTemplates,
  loadReminderTemplates,
  saveReminderTemplates,
  type ReminderTemplatesData,
} from "@/lib/reminder-templates-storage";
import { fetchClients } from "@/lib/clients";
import { getActiveLocalClients } from "@/lib/local-clients";
import { getPlanCapabilities, hasProReminderEditor, type PlanId } from "@/lib/plans";
import { getCurrentSubscription, type UserSubscription } from "@/lib/subscriptions";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { REMINDER_DRAFT_TONE_IDS, type ReminderDraftTone } from "@/lib/reminder-draft-tone";
import type { Client } from "@/app/dashboard/types";
import { EnvelopeSendButton } from "./envelope-send-button";
import { AutomationTemplatesPanel } from "./automation-templates-panel";
import { getProfile } from "@/lib/profile";
import {
  usePrefersColorSchemeDark,
  resolveUiTheme,
  readStoredUiThemePreference,
  subscribeUiThemePreferenceChange,
  writeStoredUiThemePreference,
  type UiThemePreference,
} from "@/lib/ui-theme";

type ReminderHistoryRow = {
  id: string;
  event_type: string;
  created_at: string;
  client_email: string | null;
  subject: string | null;
  error_message: string | null;
};

export function ReminderTemplatesView() {
  const { locale } = useLocale();
  const { signOut, user } = useAuth();
  const ws = useWorkspace();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [plan, setPlan] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReminderTemplatesData | null>(null);
  const [dashClients, setDashClients] = useState<Client[]>([]);
  const [aiSender, setAiSender] = useState("");
  const [aiInvoiceRef, setAiInvoiceRef] = useState("");
  const [aiAmount, setAiAmount] = useState("");
  const [aiTone, setAiTone] = useState<ReminderDraftTone>("neutral");
  const [aiDaysAfter, setAiDaysAfter] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBanner, setAiBanner] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyRows, setHistoryRows] = useState<ReminderHistoryRow[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const systemDark = usePrefersColorSchemeDark();
  const [uiThemePref, setUiThemePref] = useState<UiThemePreference>(() => readStoredUiThemePreference() ?? "light");
  const shellAppearance = useMemo(() => (resolveUiTheme(uiThemePref, systemDark) === "light" ? "light" : "dark"), [
    uiThemePref,
    systemDark,
  ]);
  const planId = plan?.planId ?? "free";
  const memberReadOnly =
    Boolean(supabase) && ws.isActingAsMember && ws.memberRoleOnEffectiveAccount === "member";
  const allowed = hasProReminderEditor(planId);
  const caps = useMemo(() => getPlanCapabilities(planId), [planId]);

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
        setPlan({ planId: "free", status: "trial", amountCents: 0, currency: "EUR", currentPeriodEnd: null });
      }
    } finally {
      setLoading(false);
    }
  }, [router, supabase, ws.effectiveOwnerUserId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch
    void refreshPlan();
  }, [refreshPlan]);

  const tplStorageKey = useMemo(() => {
    if (!supabase) return "default";
    if (!ws.ready || !ws.activeWorkspaceId) return null;
    return ws.activeWorkspaceId;
  }, [supabase, ws.ready, ws.activeWorkspaceId]);

  useEffect(() => {
    if (loading) return;
    const planId = plan?.planId ?? "free";
    if (!hasProReminderEditor(planId)) return;
    if (tplStorageKey === null) return;
    const maxTpl = 15;
    let cancelled = false;
    void (async () => {
      const loaded = loadReminderTemplates(locale, maxTpl, tplStorageKey);
      if (!cancelled) setData({ ...loaded, templates: [] });
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, locale, plan, tplStorageKey]);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const p = await getProfile(supabase, user.id);
        if (!cancelled && p) {
          setUiThemePref(p.uiTheme);
          writeStoredUiThemePreference(p.uiTheme);
        }
      } catch {
        /* colonne absente tant que migration SQL non appliquée */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user?.id]);

  useEffect(() => subscribeUiThemePreferenceChange((pref) => setUiThemePref(pref)), []);

  useEffect(() => {
    if (loading) return;
    const planId = plan?.planId ?? "free";
    if (!hasProReminderEditor(planId)) return;
    if (supabase && tplStorageKey === null) return;
    let cancelled = false;
    void (async () => {
      try {
        if (supabase && tplStorageKey) {
          const { data: auth } = await supabase.auth.getUser();
          if (!auth.user || cancelled) return;
          const list = await fetchClients(supabase, tplStorageKey);
          if (!cancelled) setDashClients(list);
        } else {
          if (!cancelled) setDashClients(getActiveLocalClients());
        }
      } catch {
        if (!cancelled) setDashClients([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading, plan, supabase, tplStorageKey]);

  useEffect(() => {
    if (loading || !supabase || !user?.id || !allowed) return;
    let cancelled = false;
    void (async () => {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from("reminder_events")
        .select("id,event_type,created_at,client_email,subject,error_message")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25);
      if (cancelled) return;
      if (error) {
        setHistoryRows([]);
      } else {
        setHistoryRows((data ?? []) as ReminderHistoryRow[]);
      }
      setHistoryLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [allowed, loading, supabase, user?.id]);

  const scheduleSave = useCallback(
    (next: ReminderTemplatesData) => {
      if (!tplStorageKey) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveReminderTemplates(next, tplStorageKey);
      }, 400);
    },
    [tplStorageKey],
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  async function handleLogout() {
    const { error: e } = await signOut();
    if (!e) router.push("/");
  }

  const t =
    locale === "fr"
      ? {
          pageTitle: "Modèles de relance",
          back: "Tableau de bord",
          upgradeTitle: "Fonction réservée aux plans Pro et Agence",
          upgradeBody: "Passez à un plan supérieur pour personnaliser vos brouillons et modèles d’e-mails.",
          upgradeCta: "Voir les offres",
          aiTitle: "IA — brouillon de relance",
          aiHint:
            "Envoi manuel uniquement : composez ici votre texte, puis utilisez le bouton enveloppe quand vous voulez l’ouvrir dans votre messagerie. Rien n’est envoyé automatiquement depuis cette page.",
          subjectLabel: "Objet",
          bodyLabel: "Corps du message",
          templatesTitle: "Modèles d’e-mails",
          templateLabel: "Modèle",
          titleField: "Titre affiché",
          reset: "Réinitialiser aux textes par défaut",
          saved: "Enregistré localement",
          localHint: "Données enregistrées dans ce navigateur.",
          addTemplate: "Ajouter un modèle",
          removeTemplate: "Retirer",
          scheduleLabel: "Délai après échéance (planification future)",
          scheduleHelp:
            "Ce délai est enregistré pour quand l’automatisation lancera une relance à heure fixe. Le périmètre ci-dessous (impayé / payé) détermine quelles fiches utiliseront ce modèle : sur le tableau de bord, le corps d’e-mail vient du premier modèle compatible avec la fiche, sinon du brouillon en haut de la page. L’objet reste celui du brouillon général.",
          scopeLabel: "Relance auto (futur) — cible de statut",
          scopeHelp: "Choisit si ce modèle concerne les factures impayées, payées, ou les deux. Utile dès aujourd’hui pour « Envoyer relance » (périmètre cohérent) ; la planification J+ viendra en plus quand l’agenda automatique existera.",
          scopeUnpaid: "Impayé",
          scopePaid: "Payé",
          scopeBoth: "Les deux",
          daysShort: (d: number) => `${d} j`,
          sendNow: "Envoyer maintenant",
          envelopeAria: "Ouvrir l’envoi du brouillon par e-mail",
          modalTitle: "Envoyer le brouillon",
          modalHint:
            "Choisissez Tout le monde (toutes les adresses du tableau de bord en Bcc), Liste (sélection avec « v »), ou Manuel (un seul e-mail). Puis ouvrez votre messagerie — rien n’est envoyé automatiquement.",
          toLabel: "Destinataire (e-mail)",
          toPlaceholder: "client@exemple.com",
          copy: "Copier tout le message",
          copied: "Copié",
          openMail: "Ouvrir l’application e-mail",
          cancel: "Fermer",
          previewHeading: "Aperçu",
          tabEveryone: "Tout le monde",
          tabList: "Liste",
          tabManual: "Manuel",
          listTitle: "Choisir les destinataires",
          listHint:
            "Appuyez sur « v » à côté d’un client pour l’ajouter ou le retirer. Les plus en retard sont en haut, les situations les plus récentes en bas.",
          listEmpty: "Aucun client sur le tableau de bord.",
          listOpenMailDisabled: "Sélectionnez au moins un client (v).",
          everyoneSummary: (n: number) => `Envoi préparé vers ${n} adresse(s) du tableau de bord (Bcc).`,
          everyoneCapped: (included: number, total: number) =>
            `Seules les ${included} première(s) adresse(s) (sur ${total}) seront mises en Bcc — plafond de votre plan. Refaites un envoi pour la suite.`,
          everyoneEmpty: "Aucun client : ajoutez des fiches sur le tableau de bord.",
          listSelectedSummary: (rowCount: number, distinct: number, max: number) =>
            rowCount === distinct
              ? `${rowCount} fiche(s) cochée(s) · ${distinct} adresse(s) e-mail · plafond ${max} (plan).`
              : `${rowCount} fiche(s) cochée(s) · ${distinct} adresse(s) e-mail distincte(s) (certaines fiches partagent la même adresse). Plafond ${max} adresse(s) par envoi.`,
          listLimitReached: (max: number) =>
            `Plafond de ${max} adresse(s) e-mail par envoi pour ce plan. Décochez un compte si vous voulez en remplacer un autre (les fiches avec le même e-mail comptent comme une seule adresse).`,
          toggleSelectAria: "Sélectionner ou désélectionner pour l’envoi",
          mailtoTooLong:
            "Lien e-mail trop long pour le navigateur. Utilisez « Copier tout le message » ou réduisez le nombre de destinataires.",
          statusPaid: "Payé",
          statusUnpaid: "Impayé",
          templateQuota: (n: number, max: number) => `Modèles enregistrés : ${n} / ${max}`,
          aiParamsTitle: "Paramètres pour l’IA (recommandés pour un texte plus précis)",
          aiSenderLabel: "Votre entreprise ou nom d’expéditeur",
          aiRefLabel: "Référence ou libellé de facture",
          aiAmountLabel: "Montant (texte libre, ex. 1 240 €)",
          aiToneLabel: "Ton du message (le style est appliqué au texte, rien n’est recopié mot pour mot dans le corps)",
          aiToneOptions: {
            neutral: "Neutre (standard professionnel)",
            gentle: "Bienveillant / amical",
            firm: "Ferme mais poli",
            urgent: "Urgent / insistant",
          } satisfies Record<ReminderDraftTone, string>,
          aiDaysLabel: "Délai après échéance (jours) — vide = J+ du 1er modèle",
          aiGenerate: "Générer par IA",
          aiGenerating: "Génération…",
          aiError: "Le service de génération a échoué. Réessayez.",
          historyTitle: "Historique des relances automatiques",
          historyEmpty: "Aucun événement pour le moment.",
          historyLoading: "Chargement de l’historique…",
          historySent: "Envoyée",
          historyFailed: "Échec",
          historyProcessing: "Traitement",
          historyQueued: "Planifiée",
          historyRetry: "Nouvel essai planifié",
          historySkipped: "Ignorée",
          historyDupEmail: "Doublon e-mail (non envoyé)",
        }
      : {
          pageTitle: "Reminder templates",
          back: "Dashboard",
          upgradeTitle: "Pro and Agency only",
          upgradeBody: "Upgrade your plan to edit reminder drafts and email templates.",
          upgradeCta: "View plans",
          aiTitle: "AI — reminder draft",
          aiHint:
            "Manual send only: write your text here, then use the envelope button whenever you want to open it in your mail app. Nothing is sent automatically from this page.",
          subjectLabel: "Subject",
          bodyLabel: "Message body",
          templatesTitle: "Email templates",
          templateLabel: "Template",
          titleField: "Display title",
          reset: "Reset to defaults",
          saved: "Saved locally",
          localHint: "Data is stored in this browser.",
          addTemplate: "Add template",
          removeTemplate: "Remove",
          scheduleLabel: "Days after due date (future scheduling)",
          scheduleHelp:
            "This delay is stored for when automatic scheduling can fire at a fixed time. The scope (unpaid / paid) below determines which rows use this template: on the dashboard, the message body is taken from the first template that matches the row, otherwise from the global draft at the top. The subject still comes from the global draft.",
          scopeLabel: "Auto reminder (future) — status target",
          scopeHelp:
            "Whether this template applies to unpaid, paid, or both. “Send reminder” on the dashboard already uses the matching body; J+ timing will add on when auto scheduling exists.",
          scopeUnpaid: "Unpaid",
          scopePaid: "Paid",
          scopeBoth: "Both",
          daysShort: (d: number) => `${d} d`,
          sendNow: "Send now",
          envelopeAria: "Open draft email in your mail app",
          modalTitle: "Send draft",
          modalHint:
            "Pick Everyone (all dashboard addresses in Bcc), List (select with “v”), or Manual (one email). Then open your mail app — nothing is sent automatically.",
          toLabel: "Recipient (email)",
          toPlaceholder: "client@example.com",
          copy: "Copy full message",
          copied: "Copied",
          openMail: "Open mail app",
          cancel: "Close",
          previewHeading: "Preview",
          tabEveryone: "Everyone",
          tabList: "List",
          tabManual: "Manual",
          listTitle: "Choose recipients",
          listHint:
            "Press “v” next to a client to add or remove them. Most overdue at the top, newest toward the bottom.",
          listEmpty: "No clients on the dashboard.",
          listOpenMailDisabled: "Select at least one client (v).",
          everyoneSummary: (n: number) => `Prepared send to ${n} dashboard address(es) (Bcc).`,
          everyoneCapped: (included: number, total: number) =>
            `Only the first ${included} of ${total} address(es) will be Bcc’d — your plan’s cap. Send again for the rest.`,
          everyoneEmpty: "No clients: add records on the dashboard.",
          listSelectedSummary: (rowCount: number, distinct: number, max: number) =>
            rowCount === distinct
              ? `${rowCount} row(s) selected · ${distinct} email address(es) · cap ${max} (plan).`
              : `${rowCount} row(s) selected · ${distinct} distinct email(s) (some rows share the same address). Max ${max} address(es) per send.`,
          listLimitReached: (max: number) =>
            `Limit of ${max} distinct email address(es) per send for this plan. Unselect a row to pick another (rows with the same email count once).`,
          toggleSelectAria: "Toggle recipient selection",
          mailtoTooLong: "Mail link is too long for the browser. Use “Copy full message” or fewer recipients.",
          statusPaid: "Paid",
          statusUnpaid: "Unpaid",
          templateQuota: (n: number, max: number) => `Templates saved: ${n} / ${max}`,
          aiParamsTitle: "Parameters for the AI (recommended for sharper copy)",
          aiSenderLabel: "Your company or sender name",
          aiRefLabel: "Invoice reference or label",
          aiAmountLabel: "Amount (free text, e.g. €1,240)",
          aiToneLabel: "Message tone (style is woven into the draft — nothing is pasted as a label into the body)",
          aiToneOptions: {
            neutral: "Neutral (standard professional)",
            gentle: "Warm / friendly",
            firm: "Firm but polite",
            urgent: "Urgent / strong",
          } satisfies Record<ReminderDraftTone, string>,
          aiDaysLabel: "Days after due — leave empty to use first template’s J+",
          aiGenerate: "Generate with AI",
          aiGenerating: "Generating…",
          aiError: "Generation failed. Please try again.",
          historyTitle: "Automatic reminder history",
          historyEmpty: "No events yet.",
          historyLoading: "Loading history…",
          historySent: "Sent",
          historyFailed: "Failed",
          historyProcessing: "Processing",
          historyQueued: "Queued",
          historyRetry: "Retry scheduled",
          historySkipped: "Skipped",
          historyDupEmail: "Duplicate email (not sent)",
        };

  const envelopeLabels = {
    sendNow: t.sendNow,
    envelopeAria: t.envelopeAria,
    modalTitle: t.modalTitle,
    modalHint: t.modalHint,
    previewHeading: t.previewHeading,
    toLabel: t.toLabel,
    toPlaceholder: t.toPlaceholder,
    copy: t.copy,
    copied: t.copied,
    openMail: t.openMail,
    cancel: t.cancel,
    tabEveryone: t.tabEveryone,
    tabList: t.tabList,
    tabManual: t.tabManual,
    listTitle: t.listTitle,
    listHint: t.listHint,
    listEmpty: t.listEmpty,
    listOpenMailDisabled: t.listOpenMailDisabled,
    everyoneSummary: t.everyoneSummary,
    everyoneCapped: t.everyoneCapped,
    everyoneEmpty: t.everyoneEmpty,
    listSelectedSummary: t.listSelectedSummary,
    listLimitReached: t.listLimitReached,
    toggleSelectAria: t.toggleSelectAria,
    mailtoTooLong: t.mailtoTooLong,
    statusPaid: t.statusPaid,
    statusUnpaid: t.statusUnpaid,
  };

  const workspaceWait = Boolean(supabase && allowed && tplStorageKey === null);
  if (loading || workspaceWait || (allowed && !data)) {
    return (
      <div>
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
          <p className={`text-sm ${shellAppearance === "light" ? "text-slate-600" : "text-slate-400"}`}>…</p>
        </DashboardShell>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div>
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
                href="/dashboard"
                className={shellAppearance === "light" ? "text-sm font-medium text-violet-700 hover:text-violet-600" : "text-sm font-medium text-violet-300 hover:text-violet-200"}
              >
                ← {t.back}
              </Link>
            </div>
            <div className={shellAppearance === "light" ? "rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900" : "rounded-2xl border border-amber-500/30 bg-amber-950/25 p-6 text-sm text-amber-50"}>
              <p className={shellAppearance === "light" ? "font-semibold text-amber-900" : "font-semibold text-amber-200"}>{t.upgradeTitle}</p>
              <p className={shellAppearance === "light" ? "mt-2 text-amber-800" : "mt-2 text-amber-100/90"}>{t.upgradeBody}</p>
              <Link
                href="/#pricing"
                className="mt-4 inline-flex rounded-lg bg-violet-600 px-4 py-2 text-xs font-semibold text-white hover:bg-violet-500"
              >
                {t.upgradeCta}
              </Link>
            </div>
          </div>
        </DashboardShell>
      </div>
    );
  }

  const d = data!;

  function patchDraft(partial: Partial<Pick<ReminderTemplatesData, "draftSubject" | "draftBody">>) {
    setData((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      scheduleSave(next);
      return next;
    });
  }

  function handleReset() {
    if (!tplStorageKey) return;
    clearReminderTemplates(tplStorageKey);
    const base = getDefaultReminderTemplates(locale);
    const next: ReminderTemplatesData = { ...base, templates: [] };
    setData(next);
    saveReminderTemplates(next, tplStorageKey);
  }

  async function handleAiGenerate() {
    setAiLoading(true);
    setAiBanner(null);
    const parsedDays = parseInt(aiDaysAfter.trim(), 10);
    const daysAfterDue = Number.isFinite(parsedDays) && parsedDays > 0 ? parsedDays : 7;
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (supabase) {
        const { data: sess } = await supabase.auth.getSession();
        const token = sess.session?.access_token;
        if (token) headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch("/api/reminder-draft-ai", {
        method: "POST",
        headers,
        body: JSON.stringify({
          locale,
          senderCompany: aiSender.trim() || undefined,
          invoiceRef: aiInvoiceRef.trim() || undefined,
          amountHint: aiAmount.trim() || undefined,
          daysAfterDue,
          tone: aiTone,
        }),
      });
      const json = (await res.json()) as { subject?: string; body?: string; warning?: string };
      if (!res.ok || typeof json.subject !== "string" || typeof json.body !== "string") {
        setAiBanner(t.aiError);
        return;
      }
      patchDraft({ draftSubject: json.subject, draftBody: json.body });
      if (json.warning) setAiBanner(json.warning);
    } catch {
      setAiBanner(t.aiError);
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div>
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
        <div className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className={`text-xl font-bold ${shellAppearance === "light" ? "text-slate-900" : "text-white"}`}>
              {t.pageTitle}
            </h2>
            <Link
              href="/dashboard"
              className={
                shellAppearance === "light"
                  ? "text-sm font-medium text-violet-700 hover:text-violet-600"
                  : "text-sm font-medium text-violet-300 hover:text-violet-200"
              }
            >
              ← {t.back}
            </Link>
          </div>

          {supabase && user ? (
            <AutomationTemplatesPanel
              supabase={supabase}
              userId={ws.effectiveOwnerUserId ?? user.id}
              planId={planId as PlanId}
              memberReadOnly={memberReadOnly}
            />
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className={
                shellAppearance === "light"
                  ? "rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  : "rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/[0.08]"
              }
            >
              {t.reset}
            </button>
            <span className={`text-xs ${shellAppearance === "light" ? "text-slate-500" : "text-slate-500"}`}>
              {t.saved}
            </span>
          </div>

          <section
            className={
              shellAppearance === "light"
                ? "rounded-2xl border border-violet-200 bg-violet-50 p-6"
                : "rounded-2xl border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-950/40 to-violet-950/30 p-6"
            }
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <h3 className={`text-sm font-semibold ${shellAppearance === "light" ? "text-violet-900" : "text-fuchsia-100"}`}>{t.aiTitle}</h3>
                <p className={`mt-2 text-sm ${shellAppearance === "light" ? "text-slate-700" : "text-slate-300"}`}>{t.aiHint}</p>
                {caps.aiReminderDrafts ? (
                  <div className="mt-4 space-y-3 rounded-xl border border-white/[0.08] bg-black/25 p-4">
                    <p className="text-xs font-semibold text-fuchsia-50/90">{t.aiParamsTitle}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-[11px] text-slate-400 sm:col-span-2">
                        {t.aiSenderLabel}
                        <input
                          type="text"
                          value={aiSender}
                          onChange={(e) => setAiSender(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-slate-100 focus:border-fuchsia-500/40 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30"
                        />
                      </label>
                      <label className="block text-[11px] text-slate-400 sm:col-span-2">
                        {t.aiRefLabel}
                        <input
                          type="text"
                          value={aiInvoiceRef}
                          onChange={(e) => setAiInvoiceRef(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-slate-100 focus:border-fuchsia-500/40 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30"
                        />
                      </label>
                      <label className="block text-[11px] text-slate-400">
                        {t.aiAmountLabel}
                        <input
                          type="text"
                          value={aiAmount}
                          onChange={(e) => setAiAmount(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-slate-100 focus:border-fuchsia-500/40 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30"
                        />
                      </label>
                      <label className="block text-[11px] text-slate-400">
                        {t.aiDaysLabel}
                        <input
                          type="number"
                          min={1}
                          value={aiDaysAfter}
                          onChange={(e) => setAiDaysAfter(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-slate-100 focus:border-fuchsia-500/40 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30"
                        />
                      </label>
                      <label className="block text-[11px] text-slate-400 sm:col-span-2">
                        {t.aiToneLabel}
                        <select
                          value={aiTone}
                          onChange={(e) => setAiTone(e.target.value as ReminderDraftTone)}
                          className="mt-1 w-full rounded-lg border border-white/10 bg-black/35 px-3 py-2 text-sm text-slate-100 focus:border-fuchsia-500/40 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/30"
                        >
                          {REMINDER_DRAFT_TONE_IDS.map((id) => (
                            <option key={id} value={id}>
                              {t.aiToneOptions[id]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleAiGenerate()}
                      disabled={aiLoading}
                      className="rounded-lg border border-violet-500/50 bg-violet-600/30 px-4 py-2 text-xs font-semibold text-violet-50 hover:bg-violet-600/45 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {aiLoading ? t.aiGenerating : t.aiGenerate}
                    </button>
                    {aiBanner ? <p className="text-xs text-amber-200/95">{aiBanner}</p> : null}
                  </div>
                ) : null}
              </div>
              {caps.aiReminderDrafts ? (
                <EnvelopeSendButton
                  subject={d.draftSubject}
                  body={d.draftBody}
                  labels={envelopeLabels}
                  clients={dashClients}
                  locale={locale}
                  planId={planId}
                />
              ) : null}
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">{t.subjectLabel}</label>
              <input
                type="text"
                value={d.draftSubject}
                onChange={(e) => patchDraft({ draftSubject: e.target.value })}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-violet-100 placeholder:text-slate-600 focus:border-fuchsia-500/50 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/40"
              />
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">{t.bodyLabel}</label>
              <textarea
                value={d.draftBody}
                onChange={(e) => patchDraft({ draftBody: e.target.value })}
                rows={6}
                className="w-full resize-y rounded-lg border border-white/10 bg-black/30 p-3 font-mono text-[13px] leading-relaxed text-violet-100 placeholder:text-slate-600 focus:border-fuchsia-500/50 focus:outline-none focus:ring-1 focus:ring-fuchsia-500/40"
              />
            </div>
          </section>

          <section className={shellAppearance === "light" ? "rounded-2xl border border-slate-200 bg-white p-6" : "rounded-2xl border border-white/[0.08] bg-[#14141c] p-6"}>
            <h3 className={shellAppearance === "light" ? "text-sm font-semibold text-slate-900" : "text-sm font-semibold text-white"}>{t.historyTitle}</h3>
            {historyLoading ? (
              <p className={shellAppearance === "light" ? "mt-3 text-xs text-slate-600" : "mt-3 text-xs text-slate-400"}>{t.historyLoading}</p>
            ) : historyRows.length === 0 ? (
              <p className="mt-3 text-xs text-slate-500">{t.historyEmpty}</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {historyRows.map((row) => {
                  const eventLabel =
                    row.event_type === "sent"
                      ? t.historySent
                      : row.event_type === "failed"
                        ? t.historyFailed
                        : row.event_type === "processing"
                          ? t.historyProcessing
                          : row.event_type === "queued"
                            ? t.historyQueued
                            : row.event_type === "retry_scheduled"
                              ? t.historyRetry
                              : row.event_type === "skipped_duplicate_email"
                                ? t.historyDupEmail
                                : t.historySkipped;
                  const toneClass =
                    row.event_type === "sent"
                      ? shellAppearance === "light"
                        ? "text-emerald-700"
                        : "text-emerald-300"
                      : row.event_type === "failed"
                        ? shellAppearance === "light"
                          ? "text-red-700"
                          : "text-red-300"
                        : row.event_type === "skipped_duplicate_email"
                          ? shellAppearance === "light"
                            ? "text-amber-700"
                            : "text-amber-300"
                          : shellAppearance === "light"
                            ? "text-slate-700"
                            : "text-slate-300";
                  return (
                    <li
                      key={row.id}
                      className={
                        shellAppearance === "light"
                          ? "rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700"
                          : "rounded-lg border border-white/[0.08] bg-black/20 px-3 py-2 text-xs text-slate-300"
                      }
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`font-semibold ${toneClass}`}>{eventLabel}</span>
                        <span className="text-slate-500">{new Date(row.created_at).toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}</span>
                      </div>
                      <p className="mt-1 break-all text-slate-400">{row.client_email ?? "—"}</p>
                      {row.subject ? <p className="mt-1 text-slate-400">{row.subject}</p> : null}
                      {row.error_message ? <p className="mt-1 text-red-300">{row.error_message}</p> : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <p className="text-xs text-slate-500">
            {locale === "fr"
              ? "Brouillon ci-dessus : enregistré localement dans ce navigateur. Modèles planifiés : base Supabase (portefeuille actif)."
              : "Draft above: stored in this browser. Scheduled templates: Supabase (active workspace)."}
          </p>
        </div>
      </DashboardShell>
    </div>
  );
}
