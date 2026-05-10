"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { readAutoRemindersEnabled, writeAutoRemindersEnabled } from "@/lib/auto-reminders";
import {
  advanceClientToNextInvoiceCycle,
  addOneMonthToIsoDate,
  displayNameForInvoiceCycle,
  fetchClients,
  fetchTrashedClients,
  insertClient,
  softDeleteClient,
  stripBillingCycleSuffix,
  updateClientStatus,
} from "@/lib/clients";
import { appendLocalClient, getActiveLocalClients, loadLocalClientStore, replaceLocalClientById } from "@/lib/local-clients";
import {
  FREE_TIER_MAX_CLIENTS,
  FREE_TIER_MAX_INVOICES,
  countDistinctClientEmailsForQuota,
  getMaxEmailTemplates,
  getPlanCapabilities,
  usesAgencyWorkspaceUi,
} from "@/lib/plans";
import { loadReminderTemplates } from "@/lib/reminder-templates-storage";
import { getProfile, updateProfileAutoReminders } from "@/lib/profile";
import {
  usePrefersColorSchemeDark,
  resolveUiTheme,
  readStoredUiThemePreference,
  subscribeUiThemePreferenceChange,
  writeStoredUiThemePreference,
  type UiThemePreference,
} from "@/lib/ui-theme";
import { getSupabaseBrowserClient, getSupabaseEnvHint, isSupabaseReady } from "@/lib/supabase";
import { AddClientForm } from "./add-client-form";
import { ClientList } from "./client-list";
import { DashboardAnalytics } from "./dashboard-analytics";
import { DashboardShell, type DashboardNavId } from "./dashboard-shell";
import { DashboardAddonTierPanels, DashboardRelancePanel } from "./dashboard-tier-panels";
import type { Client } from "./types";
import { useLocale } from "@/app/locale-context";
import { useAuth } from "@/app/auth-context";
import { useWorkspace } from "@/app/workspace-context";
import { getCurrentSubscription, setCurrentSubscriptionPlan, type UserSubscription } from "@/lib/subscriptions";
import type { PlanId } from "@/lib/plans";
import { buildMailtoSingleRecipient, MAILTO_HREF_SAFE_MAX } from "@/lib/mailto-build";
import { createMemberActionNotifications } from "@/lib/notifications";

const ReminderSendModal = dynamic(
  () => import("./reminder-send-modal").then((m) => ({ default: m.ReminderSendModal })),
  { ssr: false },
);
const AdvanceNextCycleModal = dynamic(
  () => import("./advance-next-cycle-modal").then((m) => ({ default: m.AdvanceNextCycleModal })),
  { ssr: false },
);

function parsePlanParam(value: string | null): PlanId | null {
  if (value === "free" || value === "starter" || value === "pro" || value === "agency") {
    return value;
  }
  return null;
}

function parseBillingParam(value: string | null): "monthly" | "annual" {
  return value === "annual" ? "annual" : "monthly";
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return String(Date.now());
}

async function triggerOverdueScan(params: {
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>;
  workspaceId: string;
  ownerUserId: string;
}): Promise<void> {
  const { data } = await params.supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return;
  await fetch("/api/overdue/scan", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      workspaceId: params.workspaceId,
      ownerUserId: params.ownerUserId,
    }),
  });
}

type ReminderToast = { tone: "info" | "warn"; text: string };

function buildManualReminderDraftFields(
  client: Client,
  options: {
    locale: "fr" | "en";
    aiReminderDrafts: boolean;
    currentPlanId: PlanId;
    templateWorkspaceKey: string;
  },
): { subject: string; body: string } {
  const { locale, aiReminderDrafts, currentPlanId, templateWorkspaceKey } = options;
  if (aiReminderDrafts) {
    const st = loadReminderTemplates(locale, getMaxEmailTemplates(currentPlanId), templateWorkspaceKey);
    return { subject: st.draftSubject, body: st.draftBody };
  }
  if (locale === "fr") {
    return {
      subject: `Rappel : facture en attente, ${client.name}`,
      body: [
        `Bonjour,`,
        ``,
        `Nous vous contactons concernant un montant de ${client.amountDue} € dû pour le ${client.dueDate}.`,
        `Merci de régulariser la situation ou de nous indiquer un délai.`,
        ``,
        `Cordialement,`,
        `PayPulss`,
      ].join("\n"),
    };
  }
  return {
    subject: `Reminder: pending invoice, ${client.name}`,
    body: [
      `Hello,`,
      ``,
      `We're reaching out about an amount of ${client.amountDue} EUR due on ${client.dueDate}.`,
      `Please settle when you can or let us know a timeline.`,
      ``,
      `Regards,`,
      `PayPulss`,
    ].join("\n"),
  };
}

export function DashboardView() {
  const { locale } = useLocale();
  const { signOut, user } = useAuth();
  const ws = useWorkspace();
  const [activeNav, setActiveNav] = useState<DashboardNavId>("overview");
  const overviewRef = useRef<HTMLDivElement>(null);
  const invoicesRef = useRef<HTMLDivElement>(null);
  const clientsRef = useRef<HTMLDivElement>(null);
  const relancesRef = useRef<HTMLDivElement>(null);
  const paiementsRef = useRef<HTMLDivElement>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [trashedClients, setTrashedClients] = useState<Client[]>([]);
  const [autoRemindersUserEnabled, setAutoRemindersUserEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [plan, setPlan] = useState<UserSubscription | null>(null);

  const supabaseReady = isSupabaseReady();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const envHint = getSupabaseEnvHint();
  const requestedPlan = parsePlanParam(searchParams.get("plan"));
  const requestedBilling = parseBillingParam(searchParams.get("billing"));
  const stripeQuery = searchParams.get("stripe");
  const [planNotice, setPlanNotice] = useState<string | null>(null);
  const [addTargetWorkspaceId, setAddTargetWorkspaceId] = useState<string | null>(null);
  const [reminderToast, setReminderToast] = useState<ReminderToast | null>(null);
  const [reminderMailHardError, setReminderMailHardError] = useState<string | null>(null);
  const remindCooldownTimerRef = useRef<Map<string, number>>(new Map());
  const reminderAlertRef = useRef<HTMLDivElement>(null);
  const [reminderModalClient, setReminderModalClient] = useState<Client | null>(null);
  const [remindCooldownUntil, setRemindCooldownUntil] = useState<Record<string, number>>({});

  const startRemindCooldown = useCallback((clientId: string) => {
    const prev = remindCooldownTimerRef.current.get(clientId);
    if (prev !== undefined) window.clearTimeout(prev);
    const until = Date.now() + 7000;
    setRemindCooldownUntil((p) => ({ ...p, [clientId]: until }));
    const tid = window.setTimeout(() => {
      remindCooldownTimerRef.current.delete(clientId);
      setRemindCooldownUntil((p) => {
        const next = { ...p };
        delete next[clientId];
        return next;
      });
    }, 7000);
    remindCooldownTimerRef.current.set(clientId, tid);
  }, []);

  type AdvanceModalState = {
    clientId: string;
    clientName: string;
    defaultAmount: number;
    defaultDueDate: string;
  };
  const [advanceModal, setAdvanceModal] = useState<AdvanceModalState | null>(null);
  const systemDark = usePrefersColorSchemeDark();
  const [uiThemePref, setUiThemePref] = useState<UiThemePreference>(() => readStoredUiThemePreference() ?? "light");
  const shellAppearance = useMemo(() => (resolveUiTheme(uiThemePref, systemDark) === "light" ? "light" : "dark"), [
    uiThemePref,
    systemDark,
  ]);

  useEffect(() => {
    if (!ws.activeWorkspaceId) return;
    queueMicrotask(() => setAddTargetWorkspaceId(ws.activeWorkspaceId));
  }, [ws.activeWorkspaceId]);

  useEffect(() => {
    if (!reminderToast && !reminderMailHardError) return;
    const id = window.setTimeout(() => {
      setReminderToast(null);
      setReminderMailHardError(null);
    }, 12000);
    return () => window.clearTimeout(id);
  }, [reminderToast, reminderMailHardError]);

  useEffect(() => {
    if (!reminderToast) return;
    const id = window.requestAnimationFrame(() => {
      reminderAlertRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [reminderToast]);

  const refreshClients = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      if (supabase) {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          router.replace("/login");
          return;
        }
        const billUserId = ws.effectiveOwnerUserId ?? authData.user.id;
        if (!ws.ready || !ws.activeWorkspaceId) {
          const currentPlan = await getCurrentSubscription(supabase, billUserId);
          setPlan(currentPlan);
          setClients([]);
          setTrashedClients([]);
          return;
        }
        const [currentPlan, list, trash] = await Promise.all([
          getCurrentSubscription(supabase, billUserId),
          fetchClients(supabase, ws.activeWorkspaceId),
          fetchTrashedClients(supabase, ws.activeWorkspaceId),
        ]);
        setPlan(currentPlan);
        setClients(list);
        setTrashedClients(trash);
        if (list.some((c) => c.status === "unpaid" && c.dueDate <= new Date().toISOString().slice(0, 10))) {
          void triggerOverdueScan({
            supabase,
            workspaceId: ws.activeWorkspaceId,
            ownerUserId: billUserId,
          });
        }
      } else {
        const all = loadLocalClientStore();
        setClients(all.filter((c) => !c.deletedAt));
        setTrashedClients(all.filter((c) => Boolean(c.deletedAt)));
        setPlan({ planId: "free", status: "trial", amountCents: 0, currency: "EUR", currentPeriodEnd: null });
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Impossible de charger les clients.";
      setLoadError(message);
      setClients([]);
      setTrashedClients([]);
    } finally {
      setLoading(false);
    }
  }, [router, supabase, ws.ready, ws.activeWorkspaceId, ws.effectiveOwnerUserId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshClients();
  }, [refreshClients]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAutoRemindersUserEnabled(readAutoRemindersEnabled());
  }, []);

  useEffect(() => {
    if (!supabase || !user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const p = await getProfile(supabase, user.id);
        if (!cancelled && p) {
          setAutoRemindersUserEnabled(p.autoRemindersEnabled);
          writeAutoRemindersEnabled(p.autoRemindersEnabled);
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

  const moneyFmt = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    [],
  );

  const { totalAmountDue, paidCount, clientCount, paymentRate } = useMemo(() => {
    let total = 0;
    let paid = 0;
    for (const c of clients) {
      total += c.amountDue;
      if (c.status === "paid") paid += 1;
    }
    const count = clients.length;
    const rate = count === 0 ? 0 : Math.round((paid / count) * 100);
    return { totalAmountDue: total, paidCount: paid, clientCount: count, paymentRate: rate };
  }, [clients]);

  const currentPlanId = plan?.planId ?? "free";
  const isFreePlan = currentPlanId === "free";
  const caps = useMemo(() => getPlanCapabilities(currentPlanId), [currentPlanId]);
  const tableLoading = loading || (Boolean(supabase) && !ws.ready);
  const quotaDistinctEmails = useMemo(
    () => countDistinctClientEmailsForQuota(clients, trashedClients),
    [clients, trashedClients],
  );
  const freeInvoiceLimitReached = isFreePlan && clientCount >= FREE_TIER_MAX_INVOICES;

  const reminderModalDraft = useMemo(() => {
    if (!reminderModalClient) return null;
    const tplWs = supabase && ws.activeWorkspaceId ? ws.activeWorkspaceId : "default";
    return buildManualReminderDraftFields(reminderModalClient, {
      locale,
      aiReminderDrafts: caps.aiReminderDrafts,
      currentPlanId,
      templateWorkspaceKey: tplWs,
    });
  }, [reminderModalClient, locale, caps.aiReminderDrafts, currentPlanId, supabase, ws.activeWorkspaceId]);

  const scrollToSection = useCallback((id: DashboardNavId) => {
    const map: Record<DashboardNavId, RefObject<HTMLDivElement | null>> = {
      overview: overviewRef,
      invoices: invoicesRef,
      clients: clientsRef,
      relances: relancesRef,
      paiements: paiementsRef,
    };
    map[id].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleNav = useCallback(
    (id: DashboardNavId) => {
      setActiveNav(id);
      scrollToSection(id);
    },
    [scrollToSection],
  );

  const copy = locale === "fr"
    ? {
        upgrade: "Upgrade plan",
        modeLocal: "Mode local",
        title: "Dashboard analytics",
        clientsTitle: "Vos clients",
        clientsSubtitle: "Statut des montants et relances, « Envoyer relance » ouvre votre messagerie (mailto).",
        emptyTitle: "Aucun client pour le moment, ajoute ton premier client",
        emptyBody: "Ajoute ta première fiche client pour démarrer le suivi des paiements.",
        paid: "Payé",
        unpaid: "Impayé",
        due: "Échéance",
        remind: "Envoyer relance",
        formTitle: "Nouveau client",
        formSubtitle:
          "Nom, email, montant dû et date d'échéance, stockage local ou Supabase selon configuration.",
        portfolio: "Portefeuille",
        name: "Nom",
        company: "Entreprise (optionnel)",
        email: "Email",
        amount: "Montant dû (€)",
        dueDate: "Date d'échéance",
        status: "Statut",
        submit: "Ajouter le client",
        saving: "Enregistrement…",
        remove: "Corbeille",
        markPaid: "Marquer comme payé",
        nextCycle: "Mois suivant : repasser en impayé (historique conservé)",
        nextCycleModalTitle: "Nouvelle facture (cycle suivant)",
        nextCycleModalSubtitle: "Montant et échéance pour",
        nextCycleModalAmount: "Montant dû (€)",
        nextCycleModalDue: "Date d’échéance",
        nextCycleModalCancel: "Annuler",
        nextCycleModalConfirm: "Créer la ligne",
        nextCycleModalInvalidAmount: "Montant invalide (nombre ≥ 0).",
        nextCycleModalInvalidDate: "Date invalide (format AAAA-MM-JJ).",
        deleteError: "Envoi en corbeille impossible.",
        statusError: "Mise à jour du statut impossible.",
        cycleError: "Impossible de passer au mois suivant.",
        freeLimitClients: `Plan gratuit : maximum ${FREE_TIER_MAX_CLIENTS} clients distincts (e-mails différents).`,
        freeLimitInvoices: `Plan gratuit : maximum ${FREE_TIER_MAX_INVOICES} factures.`,
        planUpdated: "Abonnement mis à jour :",
        planCheckoutFailed:
          "Paiement en ligne indisponible pour le moment. Votre plan n’a pas été modifié. Vérifiez la configuration ou réessayez plus tard.",
        stripePaymentSynced: "Paiement confirmé — votre abonnement est à jour.",
        stripePaymentCancelled: "Paiement annulé. Aucun changement d’abonnement.",
        paiementsTitle: "Synthèse paiements",
        paiementsSub: "Vue agrégée des montants marqués payés et en attente.",
        reminderModalTitle: "Envoyer une relance",
        reminderModalRecipient: "Destinataire",
        reminderModalSubject: "Objet",
        reminderModalBody: "Message",
        reminderModalCancel: "Annuler",
        reminderModalSend: "Ouvrir ma messagerie",
        reminderModalSending: "Ouverture…",
        reminderModalSubjectRequired: "L’objet est obligatoire.",
        reminderModalMailtoTooLong:
          "Le message est trop long pour un lien mailto. Raccourcissez le corps ou l’objet, puis réessayez.",
        reminderModalMailtoDone: "Votre application de messagerie devrait s’ouvrir avec le brouillon prêt à envoyer.",
      }
    : {
        upgrade: "Upgrade plan",
        modeLocal: "Local mode",
        title: "Analytics dashboard",
        clientsTitle: "Your clients",
        clientsSubtitle: "Payment status and reminders, “Send reminder” opens your mail app (mailto).",
        emptyTitle: "No clients yet, add your first client",
        emptyBody: "Add your first client to start tracking your cashflow.",
        paid: "Paid",
        unpaid: "Unpaid",
        due: "Due date",
        remind: "Send reminder",
        formTitle: "Add client",
        formSubtitle: "Name, email, due amount and due date, stored locally or in Supabase.",
        portfolio: "Wallet",
        name: "Name",
        company: "Company (optional)",
        email: "Email",
        amount: "Amount due (€)",
        dueDate: "Due date",
        status: "Status",
        submit: "Add client",
        saving: "Saving...",
        remove: "Trash",
        markPaid: "Mark as paid",
        nextCycle: "Next month: mark unpaid again (history kept)",
        nextCycleModalTitle: "New invoice (next cycle)",
        nextCycleModalSubtitle: "Amount and due date for",
        nextCycleModalAmount: "Amount due (€)",
        nextCycleModalDue: "Due date",
        nextCycleModalCancel: "Cancel",
        nextCycleModalConfirm: "Create row",
        nextCycleModalInvalidAmount: "Invalid amount (number ≥ 0).",
        nextCycleModalInvalidDate: "Invalid date (YYYY-MM-DD).",
        deleteError: "Could not move to trash.",
        statusError: "Status update failed.",
        cycleError: "Could not advance to next billing cycle.",
        freeLimitClients: `Free plan: at most ${FREE_TIER_MAX_CLIENTS} distinct clients (different emails).`,
        freeLimitInvoices: `Free plan: at most ${FREE_TIER_MAX_INVOICES} invoices.`,
        planUpdated: "Subscription updated:",
        planCheckoutFailed:
          "Online checkout is unavailable. Your plan was not changed. Try again later or contact support.",
        stripePaymentSynced: "Payment confirmed — your subscription is synced.",
        stripePaymentCancelled: "Payment cancelled. Your plan was not changed.",
        paiementsTitle: "Payments summary",
        paiementsSub: "Aggregated view of marked paid vs pending amounts.",
        reminderModalTitle: "Send a reminder",
        reminderModalRecipient: "Recipient",
        reminderModalSubject: "Subject",
        reminderModalBody: "Message",
        reminderModalCancel: "Cancel",
        reminderModalSend: "Open my mail app",
        reminderModalSending: "Opening…",
        reminderModalSubjectRequired: "Subject is required.",
        reminderModalMailtoTooLong:
          "The message is too long for a mailto link. Shorten the body or subject and try again.",
        reminderModalMailtoDone: "Your mail app should open with the draft ready to send.",
      };

  const planNoticePrefix = copy.planUpdated;

  const memberReadOnly =
    Boolean(supabase) && ws.isActingAsMember && ws.memberRoleOnEffectiveAccount === "member";

  async function notifyMemberAction(title: string, body: string, payload?: Record<string, unknown>) {
    if (!supabase || !user?.id) return;
    const ownerId = ws.effectiveOwnerUserId ?? user.id;
    await createMemberActionNotifications(supabase, {
      ownerUserId: ownerId,
      actorUserId: user.id,
      workspaceId: ws.activeWorkspaceId,
      title,
      body,
      payload,
      notificationKeyBase: `member_action:${Date.now()}:${Math.random().toString(16).slice(2)}`,
    });
  }

  const agencyPortfolioOptions = useMemo(() => {
    if (!usesAgencyWorkspaceUi(currentPlanId) || !supabase || !ws.ready || ws.workspaces.length === 0) {
      return undefined;
    }
    return ws.workspaces.map((w) => ({ id: w.id, name: w.name }));
  }, [currentPlanId, supabase, ws.ready, ws.workspaces]);

  async function handleAdd(data: Omit<Client, "id"> & { targetWorkspaceId?: string }) {
    setAddError(null);
    if (isFreePlan) {
      if (clients.length >= FREE_TIER_MAX_INVOICES) {
        setAddError(copy.freeLimitInvoices);
        return;
      }
      const emails = new Set(
        [...clients, ...trashedClients].map((c) => c.email.trim().toLowerCase()),
      );
      const nextEmail = data.email.trim().toLowerCase();
      if (!emails.has(nextEmail) && emails.size >= FREE_TIER_MAX_CLIENTS) {
        setAddError(copy.freeLimitClients);
        return;
      }
    }
    if (supabase) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;
        if (!user) {
          setAddError(locale === "fr" ? "Session expirée. Reconnectez-vous." : "Session expired. Please login again.");
          return;
        }
        if (memberReadOnly) {
          setAddError(
            locale === "fr"
              ? "Les membres (lecture seule) ne peuvent pas ajouter de clients."
              : "Read-only members cannot add clients.",
          );
          return;
        }
        const wsId = data.targetWorkspaceId ?? ws.activeWorkspaceId;
        if (!wsId) {
          setAddError(locale === "fr" ? "Portefeuille non prêt. Réessayez." : "Wallet not ready. Try again.");
          return;
        }
        const ownerRowUserId = ws.effectiveOwnerUserId ?? user.id;
        const created = await insertClient(supabase, { ...data, userId: ownerRowUserId, workspaceId: wsId });
        setClients((prev) => [created, ...prev]);
        await notifyMemberAction(
          locale === "fr" ? "Client ajouté" : "Client added",
          locale === "fr" ? `${created.name} a été ajouté au dashboard.` : `${created.name} was added to dashboard.`,
          { clientId: created.id, action: "client_created" },
        );
      } catch (e) {
        const rawMessage =
          typeof e === "object" && e !== null && "message" in e ? String((e as { message?: unknown }).message ?? "") : "";
        if (rawMessage.toUpperCase().includes("FREE_PLAN_LIMIT_REACHED")) {
          setAddError(copy.freeLimitInvoices);
          return;
        }
        const message = rawMessage || (locale === "fr" ? "Impossible d’ajouter le client." : "Could not add client.");
        setAddError(message);
      }
      return;
    }

    try {
      const now = new Date().toISOString();
      const initialPaidEvents =
        data.status === "paid" ? [{ at: now, amount: data.amountDue }] : undefined;
      const created: Client = {
        ...data,
        id: newId(),
        createdAt: now,
        paidAt: data.status === "paid" ? now : null,
        deletedAt: null,
        paidEvents: initialPaidEvents,
      };
      appendLocalClient(created);
      setClients((prev) => [created, ...prev]);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Impossible d’ajouter le client.";
      setAddError(message);
    }
  }

  function handleRequestSendReminder(client: Client) {
    setReminderMailHardError(null);
    setReminderToast(null);
    if (client.status !== "unpaid") return;
    const cooldownEnd = remindCooldownUntil[client.id];
    if (typeof cooldownEnd === "number" && Date.now() < cooldownEnd) return;
    if (!client.email?.trim()) {
      setReminderMailHardError(
        locale === "fr" ? "Adresse e-mail du client manquante." : "Client email is missing.",
      );
      return;
    }
    setReminderModalClient(client);
  }

  async function handleReminderModalSend(payload: { subject: string; body: string }) {
    const client = reminderModalClient;
    if (!client) return;
    const to = client.email?.trim();
    if (!to) {
      setReminderMailHardError(
        locale === "fr" ? "Adresse e-mail du client manquante." : "Client email is missing.",
      );
      return;
    }

    const footer =
      locale === "fr"
        ? `\n\n${client.name} · ${client.amountDue} € · échéance ${client.dueDate}`
        : `\n\n${client.name} · ${client.amountDue} € · due ${client.dueDate}`;

    const autoEffective = caps.autoReminders && autoRemindersUserEnabled;
    let extra = "";
    if (autoEffective && !caps.basicRemindersOnly && !caps.aiReminderDrafts) {
      extra =
        locale === "fr"
          ? "\n\nProchaine relance programmée dans 3 jours si aucun paiement."
          : "\n\nNext reminder scheduled in 3 days if unpaid.";
    }
    const bodyWithFooter = `${payload.body}${footer}${extra}`;
    const href = buildMailtoSingleRecipient(to, payload.subject, bodyWithFooter);
    if (href.length > MAILTO_HREF_SAFE_MAX) {
      setReminderMailHardError(copy.reminderModalMailtoTooLong);
      return;
    }

    setReminderModalClient(null);
    setReminderMailHardError(null);
    try {
      const a = document.createElement("a");
      a.href = href;
      a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.location.href = href;
    }
    setReminderToast({
      tone: "info",
      text: copy.reminderModalMailtoDone,
    });
    startRemindCooldown(client.id);
  }

  async function handleMoveToTrash(clientId: string) {
    setAddError(null);
    if (memberReadOnly) {
      setAddError(
        locale === "fr"
          ? "Les membres (lecture seule) ne peuvent pas mettre en corbeille."
          : "Read-only members cannot move items to trash.",
      );
      return;
    }
    const now = new Date().toISOString();
    if (!supabase) {
      replaceLocalClientById(clientId, { deletedAt: now });
      const all = loadLocalClientStore();
      setClients(all.filter((c) => !c.deletedAt));
      setTrashedClients(all.filter((c) => Boolean(c.deletedAt)));
      return;
    }

    try {
      const row = clients.find((c) => c.id === clientId);
      await softDeleteClient(supabase, clientId);
      setClients((prev) => prev.filter((c) => c.id !== clientId));
      if (row) {
        setTrashedClients((prev) => [{ ...row, deletedAt: now }, ...prev]);
        await notifyMemberAction(
          locale === "fr" ? "Client déplacé en corbeille" : "Client moved to trash",
          locale === "fr" ? `${row.name} a été déplacé en corbeille.` : `${row.name} was moved to trash.`,
          { clientId: row.id, action: "client_trashed" },
        );
      }
    } catch (e) {
      const message =
        typeof e === "object" && e !== null && "message" in e ? String((e as { message?: unknown }).message ?? "") : "";
      setAddError(message || copy.deleteError);
    }
  }

  async function handleMarkPaid(clientId: string) {
    setAddError(null);
    if (!supabase) {
      const paidAt = new Date().toISOString();
      const cur = loadLocalClientStore().find((c) => c.id === clientId);
      const prevEv = cur?.paidEvents ?? [];
      const nextEvents = [...prevEv, { at: paidAt, amount: cur?.amountDue ?? 0 }];
      replaceLocalClientById(clientId, { status: "paid", paidAt, paidEvents: nextEvents });
      setClients((prev) =>
        prev.map((client) =>
          client.id === clientId ? { ...client, status: "paid" as const, paidAt, paidEvents: nextEvents } : client,
        ),
      );
      return;
    }

    try {
      const updated = await updateClientStatus(supabase, clientId, "paid");
      setClients((prev) => prev.map((client) => (client.id === clientId ? updated : client)));
      await notifyMemberAction(
        locale === "fr" ? "Facture marquée payée" : "Invoice marked paid",
        locale === "fr" ? `${updated.name} a été marqué payé.` : `${updated.name} was marked paid.`,
        { clientId: updated.id, action: "client_mark_paid" },
      );
    } catch (e) {
      const message =
        typeof e === "object" && e !== null && "message" in e ? String((e as { message?: unknown }).message ?? "") : "";
      setAddError(message || copy.statusError);
    }
  }

  function openAdvanceCycleModal(clientId: string) {
    setAddError(null);
    if (memberReadOnly) {
      setAddError(
        locale === "fr"
          ? "Les membres (lecture seule) ne peuvent pas modifier les factures."
          : "Read-only members cannot change invoices.",
      );
      return;
    }
    if (isFreePlan && clientCount >= FREE_TIER_MAX_INVOICES) {
      setAddError(copy.freeLimitInvoices);
      return;
    }
    const cur = clients.find((c) => c.id === clientId);
    if (!cur || cur.status !== "paid") return;
    setAdvanceModal({
      clientId: cur.id,
      clientName: cur.name,
      defaultAmount: cur.amountDue,
      defaultDueDate: addOneMonthToIsoDate(cur.dueDate),
    });
  }

  async function handleAdvanceCycleConfirm(payload: { amountDue: number; dueDate: string }) {
    setAddError(null);
    const draft = advanceModal;
    if (!draft) return;
    if (memberReadOnly) return;
    if (isFreePlan && clientCount >= FREE_TIER_MAX_INVOICES) {
      setAddError(copy.freeLimitInvoices);
      return;
    }
    const cur = clients.find((c) => c.id === draft.clientId);
    if (!cur || cur.status !== "paid") {
      setAdvanceModal(null);
      return;
    }

    if (!supabase) {
      const emailKey = cur.email.trim().toLowerCase();
      const sameEmailRows = getActiveLocalClients().filter((c) => c.email.trim().toLowerCase() === emailKey).length;
      const nextCycleNumber = sameEmailRows + 1;
      const baseName = stripBillingCycleSuffix(cur.name);
      const nextName = displayNameForInvoiceCycle(baseName, nextCycleNumber);
      const now = new Date().toISOString();
      const newClient: Client = {
        id: newId(),
        name: nextName,
        companyName: cur.companyName,
        email: cur.email,
        amountDue: payload.amountDue,
        dueDate: payload.dueDate,
        status: "unpaid",
        createdAt: now,
        paidAt: null,
        paidEvents: [],
        deletedAt: null,
      };
      appendLocalClient(newClient);
      setClients((prev) => [newClient, ...prev]);
      setAdvanceModal(null);
      return;
    }

    try {
      const created = await advanceClientToNextInvoiceCycle(supabase, draft.clientId, payload);
      setClients((prev) => [created, ...prev]);
      await notifyMemberAction(
        locale === "fr" ? "Cycle suivant créé" : "Next cycle created",
        locale === "fr"
          ? `Nouvelle ligne ${created.name} créée pour le cycle suivant.`
          : `New row ${created.name} created for next cycle.`,
        { clientId: created.id, action: "client_advance_cycle" },
      );
      setAdvanceModal(null);
    } catch (e) {
      const raw =
        typeof e === "object" && e !== null && "message" in e ? String((e as { message?: unknown }).message ?? "") : "";
      if (raw === "CLIENT_NOT_PAID") {
        setAddError(locale === "fr" ? "Cette fiche n’est pas marquée payée." : "This row is not marked paid.");
        return;
      }
      if (raw === "CLIENT_MISSING_WORKSPACE_OR_USER") {
        setAddError(
          locale === "fr"
            ? "Ligne incomplète (workspace). Réessayez après rechargement ou contactez le support."
            : "Incomplete row (workspace). Reload or contact support.",
        );
        return;
      }
      if (raw.toUpperCase().includes("FREE_PLAN_LIMIT_REACHED")) {
        setAddError(copy.freeLimitInvoices);
        return;
      }
      setAddError(raw || copy.cycleError);
    }
  }

  async function handleLogout() {
    const { error } = await signOut();
    if (!error) {
      router.push("/");
      return;
    }
    setLoadError(error);
  }

  useEffect(() => {
    if (!supabase || !requestedPlan) return;
    let cancelled = false;

    const applyRequestedPlan = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData.user;
        if (!authUser) return;

        if (requestedPlan !== "free") {
          const { data: sess } = await supabase.auth.getSession();
          const token = sess.session?.access_token;
          if (!token) return;
          let res: Response;
          try {
            res = await fetch("/api/stripe/checkout", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ planId: requestedPlan, billingCycle: requestedBilling }),
            });
          } catch {
            if (!cancelled) {
              setPlanNotice(copy.planCheckoutFailed);
              router.replace("/dashboard");
            }
            return;
          }
          let json: { url?: string; code?: string } = {};
          try {
            json = (await res.json()) as { url?: string; code?: string };
          } catch {
            if (!cancelled) {
              setPlanNotice(copy.planCheckoutFailed);
              router.replace("/dashboard");
            }
            return;
          }
          if (!cancelled && res.ok && typeof json.url === "string" && json.url.length > 0) {
            window.location.href = json.url;
            return;
          }
          if (!cancelled) {
            setPlanNotice(copy.planCheckoutFailed);
            router.replace("/dashboard");
          }
          return;
        }

        const updated = await setCurrentSubscriptionPlan(supabase, authUser.id, requestedPlan);
        if (!cancelled) {
          setPlan(updated);
          setPlanNotice(`${planNoticePrefix} ${updated.planId.toUpperCase()} (${updated.status})`);
          void ws.refreshWorkspaces();
          router.replace("/dashboard");
        }
      } catch {
        if (!cancelled) {
          setPlanNotice(null);
        }
      }
    };

    void applyRequestedPlan();
    return () => {
      cancelled = true;
    };
  }, [
    copy.planCheckoutFailed,
    planNoticePrefix,
    requestedPlan,
    requestedBilling,
    router,
    supabase,
    ws.refreshWorkspaces,
  ]);

  useEffect(() => {
    if (!supabase || stripeQuery !== "success" || !user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const p = await getCurrentSubscription(supabase, user.id);
        if (!cancelled) {
          setPlan(p);
          setPlanNotice(copy.stripePaymentSynced);
          void ws.refreshWorkspaces();
          router.replace("/dashboard");
        }
      } catch {
        if (!cancelled) router.replace("/dashboard");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [stripeQuery, supabase, user?.id, router, copy.stripePaymentSynced, ws.refreshWorkspaces]);

  useEffect(() => {
    if (stripeQuery !== "cancel") return;
    setPlanNotice(copy.stripePaymentCancelled);
    router.replace("/dashboard");
  }, [stripeQuery, router, copy.stripePaymentCancelled]);

  return (
    <div>
      <DashboardShell
        locale={locale}
        planId={currentPlanId}
        activeNav={activeNav}
        onNav={handleNav}
        userEmail={user?.email}
        onLogout={handleLogout}
        hideTrashNav={memberReadOnly}
        appearance={shellAppearance}
      >
        {envHint ? (
          <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900" role="status">
            <strong className="font-semibold text-sky-950">Supabase (optionnel).</strong> {envHint}{" "}
            <span className="text-sky-800">
              Mode local : données dans ce navigateur. Exécutez{" "}
              <code className="rounded bg-sky-100 px-1 py-0.5 text-xs">supabase/schema.sql</code> pour la table{" "}
              <code className="rounded bg-sky-100 px-1 py-0.5 text-xs">clients</code>.
            </span>
          </div>
        ) : null}

        {loadError && supabaseReady ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            <strong className="font-semibold">Erreur Supabase.</strong> {loadError}
          </div>
        ) : null}

        {addError ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            <strong className="font-semibold">Ajout impossible.</strong> {addError}
          </div>
        ) : null}

        {planNotice ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
            <strong className="font-semibold">{planNotice}</strong>
          </div>
        ) : null}

        {reminderToast ? (
          <div
            ref={reminderAlertRef}
            className={`scroll-mt-24 mb-6 rounded-xl border px-4 py-3 text-sm ${
              reminderToast.tone === "info"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-amber-200 bg-amber-50 text-amber-900"
            }`}
            role="status"
            aria-live="polite"
          >
            <strong className="block font-semibold text-slate-900">
              {reminderToast.tone === "info"
                ? locale === "fr"
                  ? "Relance envoyée"
                  : "Reminder sent"
                : locale === "fr"
                  ? "Relance"
                  : "Reminder"}
            </strong>
            <span
              className={
                reminderToast.tone === "info"
                  ? "mt-1 block text-emerald-800"
                  : "mt-1 block text-amber-800"
              }
            >
              {reminderToast.text}
            </span>
          </div>
        ) : null}

        {reminderMailHardError ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            <strong className="font-semibold">{locale === "fr" ? "Relance." : "Reminder."}</strong> {reminderMailHardError}
          </div>
        ) : null}

        {isFreePlan ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-semibold text-amber-950">FREE</span> ·{" "}
            {locale === "fr" ? "Quotas : " : "Limits: "}
            <span className="tabular-nums text-amber-950">
              {quotaDistinctEmails}/{FREE_TIER_MAX_CLIENTS}{" "}
              {locale === "fr" ? "clients distincts" : "distinct clients"}
            </span>
            {" · "}
            <span className="tabular-nums text-amber-950">
              {clientCount}/{FREE_TIER_MAX_INVOICES} {locale === "fr" ? "factures" : "invoices"}
            </span>
            {quotaDistinctEmails >= FREE_TIER_MAX_CLIENTS && clientCount < FREE_TIER_MAX_INVOICES ? (
              <p className="mt-2 text-xs text-amber-800">
                {locale === "fr"
                  ? "Vous pouvez encore ajouter des factures pour les e-mails déjà connus."
                  : "You can still add invoices for emails already on file."}
              </p>
            ) : null}
          </div>
        ) : null}

        <div ref={overviewRef} className="min-w-0 scroll-mt-28 space-y-6">
          <DashboardAnalytics
            clients={clients}
            locale={locale}
            fullCharts={caps.fullDashboardCharts}
            advancedStats={caps.advancedStats}
            appearance={shellAppearance}
          />
          <DashboardAddonTierPanels
            locale={locale}
            caps={caps}
            appearance={shellAppearance}
            workspaces={supabase && ws.ready ? ws.workspaces.map((w) => ({ id: w.id, name: w.name })) : undefined}
          />
        </div>

        <div ref={relancesRef} className="min-w-0 scroll-mt-28 mt-10 space-y-6">
          <DashboardRelancePanel
            locale={locale}
            caps={caps}
            appearance={shellAppearance}
            autoRemindersUserEnabled={autoRemindersUserEnabled}
            onAutoRemindersUserEnabledChange={async (enabled) => {
              setAutoRemindersUserEnabled(enabled);
              writeAutoRemindersEnabled(enabled);
              if (supabase && user?.id) {
                try {
                  await updateProfileAutoReminders(supabase, user.id, enabled);
                } catch {
                  /* profil / colonne manquante */
                }
              }
            }}
          />
        </div>

        <div ref={invoicesRef} className="min-w-0 scroll-mt-28 mt-12 space-y-6">
          {tableLoading ? (
            <div
              className={`pp-dashboard-card-interactive rounded-2xl border px-6 py-12 text-center text-sm hover:border-slate-300 ${
                shellAppearance === "light"
                  ? "border-slate-200 bg-white text-slate-600"
                  : "border-white/[0.08] bg-[#14141c] text-slate-400 hover:border-white/12"
              }`}
            >
              {locale === "fr" ? "Chargement des factures…" : "Loading invoices…"}
            </div>
          ) : (
              <ClientList
                appearance={shellAppearance}
                clients={clients}
                onSendReminder={handleRequestSendReminder}
                remindCooldownUntil={remindCooldownUntil}
                onDelete={handleMoveToTrash}
                onMarkPaid={handleMarkPaid}
                onAdvanceNextCycle={memberReadOnly ? undefined : openAdvanceCycleModal}
                hideDelete={memberReadOnly}
              labels={{
                title: locale === "fr" ? "Factures & dossiers" : "Invoices & cases",
                subtitle: copy.clientsSubtitle,
                emptyTitle: copy.emptyTitle,
                emptyBody: copy.emptyBody,
                paid: copy.paid,
                unpaid: copy.unpaid,
                due: copy.due,
                remind: copy.remind,
                delete: copy.remove,
                markPaid: copy.markPaid,
                nextCycle: copy.nextCycle,
              }}
            />
          )}
        </div>

        <div ref={clientsRef} className="min-w-0 scroll-mt-28 mt-12">
          <AddClientForm
            appearance={shellAppearance}
            onAdd={handleAdd}
            disabled={tableLoading || memberReadOnly}
            supabaseActive={supabaseReady}
            freeInvoiceLimitReached={freeInvoiceLimitReached}
            freeClientDistinctCount={quotaDistinctEmails}
            freeClientMax={isFreePlan ? FREE_TIER_MAX_CLIENTS : undefined}
            locale={locale}
            portfolioOptions={agencyPortfolioOptions}
            portfolioWorkspaceId={addTargetWorkspaceId ?? ws.activeWorkspaceId}
            onPortfolioChange={setAddTargetWorkspaceId}
            labels={{
              title: copy.formTitle,
              subtitle: copy.formSubtitle,
              portfolio: copy.portfolio,
              name: copy.name,
              company: copy.company,
              email: copy.email,
              amount: copy.amount,
              dueDate: copy.dueDate,
              status: copy.status,
              paid: copy.paid,
              unpaid: copy.unpaid,
              submit: copy.submit,
              saving: copy.saving,
            }}
          />
        </div>

        <div ref={paiementsRef} className="min-w-0 scroll-mt-28 mt-12">
          <section
            className={`pp-dashboard-card-interactive rounded-2xl border p-4 sm:p-6 ${
              shellAppearance === "light"
                ? "border-slate-200 bg-white hover:border-violet-300/60"
                : "border-white/[0.08] bg-[#14141c] hover:border-violet-500/35"
            }`}
          >
            <h2 className={`text-base sm:text-lg font-semibold ${shellAppearance === "light" ? "text-slate-900" : "text-white"}`}>
              {copy.paiementsTitle}
            </h2>
            <p className={`mt-1 text-xs sm:text-sm ${shellAppearance === "light" ? "text-slate-600" : "text-slate-400"}`}>
              {copy.paiementsSub}
            </p>
            <dl className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 sm:grid-cols-3">
              <div
                className={`rounded-xl border px-4 py-3 ${
                  shellAppearance === "light" ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/30"
                }`}
              >
                <dt className={`text-xs font-medium uppercase tracking-wide ${shellAppearance === "light" ? "text-slate-500" : "text-slate-400"}`}>
                  {locale === "fr" ? "Encours total" : "Total outstanding"}
                </dt>
                <dd className={`mt-1 text-lg sm:text-xl font-semibold tabular-nums ${shellAppearance === "light" ? "text-slate-900" : "text-white"}`}>
                  {moneyFmt.format(totalAmountDue)}
                </dd>
              </div>
              <div
                className={`rounded-xl border px-4 py-3 ${
                  shellAppearance === "light" ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/30"
                }`}
              >
                <dt className={`text-xs font-medium uppercase tracking-wide ${shellAppearance === "light" ? "text-slate-500" : "text-slate-400"}`}>
                  {locale === "fr" ? "Factures payées" : "Paid invoices"}
                </dt>
                <dd
                  className={`mt-1 text-lg sm:text-xl font-semibold tabular-nums ${
                    shellAppearance === "light" ? "text-emerald-700" : "text-emerald-300"
                  }`}
                >
                  {paidCount}
                </dd>
              </div>
              <div
                className={`rounded-xl border px-4 py-3 ${
                  shellAppearance === "light" ? "border-slate-200 bg-slate-50" : "border-white/10 bg-black/30"
                }`}
              >
                <dt className={`text-xs font-medium uppercase tracking-wide ${shellAppearance === "light" ? "text-slate-500" : "text-slate-400"}`}>
                  {locale === "fr" ? "Taux de paiement" : "Payment rate"}
                </dt>
                <dd
                  className={`mt-1 text-lg sm:text-xl font-semibold tabular-nums ${
                    shellAppearance === "light" ? "text-violet-700" : "text-violet-300"
                  }`}
                >
                  {paymentRate}%
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/#pricing"
                className={`inline-flex rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  shellAppearance === "light"
                    ? "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100"
                    : "border-violet-500/40 bg-violet-950/40 text-violet-200 hover:bg-violet-950/60"
                }`}
              >
                {copy.upgrade}
              </Link>
              <Link
                href="/settings"
                className={`inline-flex rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  shellAppearance === "light"
                    ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    : "border-white/15 bg-black/30 text-slate-200 hover:bg-white/10"
                }`}
              >
                {locale === "fr" ? "Paramètres compte" : "Account settings"}
              </Link>
            </div>
          </section>
        </div>
      </DashboardShell>
      {advanceModal ? (
        <AdvanceNextCycleModal
          open
          clientName={advanceModal.clientName}
          defaultAmount={advanceModal.defaultAmount}
          defaultDueDate={advanceModal.defaultDueDate}
          labels={{
            title: copy.nextCycleModalTitle,
            subtitle: copy.nextCycleModalSubtitle,
            amount: copy.nextCycleModalAmount,
            dueDate: copy.nextCycleModalDue,
            cancel: copy.nextCycleModalCancel,
            confirm: copy.nextCycleModalConfirm,
            invalidAmount: copy.nextCycleModalInvalidAmount,
            invalidDate: copy.nextCycleModalInvalidDate,
          }}
          onClose={() => setAdvanceModal(null)}
          onConfirm={(p) => {
            void handleAdvanceCycleConfirm(p);
          }}
        />
      ) : null}
      {reminderModalClient && reminderModalDraft ? (
        <ReminderSendModal
          key={reminderModalClient.id}
          open
          recipientEmail={reminderModalClient.email.trim()}
          initialSubject={reminderModalDraft.subject}
          initialBody={reminderModalDraft.body}
          labels={{
            title: copy.reminderModalTitle,
            recipient: copy.reminderModalRecipient,
            subject: copy.reminderModalSubject,
            body: copy.reminderModalBody,
            cancel: copy.reminderModalCancel,
            send: copy.reminderModalSend,
            sending: copy.reminderModalSending,
            subjectRequired: copy.reminderModalSubjectRequired,
          }}
          onClose={() => setReminderModalClient(null)}
          onSend={handleReminderModalSend}
        />
      ) : null}
    </div>
  );
}
