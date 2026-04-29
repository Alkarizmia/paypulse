"use client";

import Link from "next/link";
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
import { loadReminderTemplates, pickFirstMatchingReminderTemplate } from "@/lib/reminder-templates-storage";
import { getProfile, updateProfileAutoReminders } from "@/lib/profile";
import { getSupabaseBrowserClient, getSupabaseEnvHint, isSupabaseReady } from "@/lib/supabase";
import { AdvanceNextCycleModal } from "./advance-next-cycle-modal";
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

function parsePlanParam(value: string | null): PlanId | null {
  if (value === "free" || value === "starter" || value === "pro" || value === "agency") {
    return value;
  }
  return null;
}

function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return String(Date.now());
}

/** Limite prudente pour `mailto:` (mobiles / IE anciens ; évite les liens tronqués). */
const MAILTO_SAFE_MAX = 1950;

type ReminderToast = { tone: "info" | "warn"; text: string };

/**
 * Ouvre la messagerie de l’utilisateur (brouillon) — pas d’envoi serveur ; l’expéditeur reste le compte du freelance.
 */
function openReminderInUserMailClient(params: {
  to: string;
  subject: string;
  body: string;
  locale: "fr" | "en";
  setToast: (t: ReminderToast | null) => void;
  setHardError: (msg: string | null) => void;
}) {
  const { to, subject, body, locale, setToast, setHardError } = params;
  setHardError(null);

  const encTo = encodeURIComponent(to.trim());
  const encSub = encodeURIComponent(subject);
  const encBody = encodeURIComponent(body);
  const fullHref = `mailto:${encTo}?subject=${encSub}&body=${encBody}`;

  const msgOpenOk: ReminderToast = {
    tone: "info",
    text:
      locale === "fr"
        ? "Votre messagerie devrait s’ouvrir avec le brouillon. L’e-mail part depuis votre propre adresse (pas depuis PayPulse)."
        : "Your mail app should open with the draft. You send from your own address (not from PayPulse).",
  };

  const msgBodyCopied: ReminderToast = {
    tone: "warn",
    text:
      locale === "fr"
        ? "Le message est long : le corps a été copié dans le presse-papiers — collez-le (Ctrl+V / Cmd+V) dans le brouillon. Destinataire et objet sont préremplis."
        : "Long message: the body was copied to the clipboard — paste it (Ctrl+V / Cmd+V). Recipient and subject are pre-filled.",
  };

  const msgClipFail =
    locale === "fr"
      ? "Impossible d’ouvrir ou de copier automatiquement. Ouvrez votre messagerie et copiez l’objet et le texte manuellement."
      : "Could not open mail or copy automatically. Open your mail app and paste subject and body manually.";

  const pasteBlock = `${subject}\n\n${body}`;

  const openHref = (href: string) => {
    try {
      window.location.assign(href);
    } catch {
      setHardError(msgClipFail);
    }
  };

  if (fullHref.length <= MAILTO_SAFE_MAX) {
    openHref(fullHref);
    setToast(msgOpenOk);
    return;
  }

  const hrefSubjectOnly = `mailto:${encTo}?subject=${encSub}`;
  if (hrefSubjectOnly.length <= MAILTO_SAFE_MAX) {
    void navigator.clipboard
      .writeText(body)
      .then(() => {
        openHref(hrefSubjectOnly);
        setToast(msgBodyCopied);
      })
      .catch(() => {
        openHref(hrefSubjectOnly);
        setToast({
          tone: "warn",
          text:
            locale === "fr"
              ? "Messagerie ouverte avec l’objet — le corps est trop long pour un lien. Rédigez un court message ou utilisez vos modèles."
              : "Mail opened with subject — body too long for a link. Write a short note or use your templates.",
        });
      });
    return;
  }

  void navigator.clipboard
    .writeText(pasteBlock)
    .then(() => {
      openHref(`mailto:${encTo}`);
      setToast(msgBodyCopied);
    })
    .catch(() => {
      setHardError(msgClipFail);
    });
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
  const [planNotice, setPlanNotice] = useState<string | null>(null);
  const [addTargetWorkspaceId, setAddTargetWorkspaceId] = useState<string | null>(null);
  const [reminderToast, setReminderToast] = useState<ReminderToast | null>(null);
  const [reminderMailHardError, setReminderMailHardError] = useState<string | null>(null);
  type AdvanceModalState = {
    clientId: string;
    clientName: string;
    defaultAmount: number;
    defaultDueDate: string;
  };
  const [advanceModal, setAdvanceModal] = useState<AdvanceModalState | null>(null);

  useEffect(() => {
    if (ws.activeWorkspaceId) {
      setAddTargetWorkspaceId(ws.activeWorkspaceId);
    }
  }, [ws.activeWorkspaceId]);

  useEffect(() => {
    if (!reminderToast && !reminderMailHardError) return;
    const id = window.setTimeout(() => {
      setReminderToast(null);
      setReminderMailHardError(null);
    }, 12000);
    return () => window.clearTimeout(id);
  }, [reminderToast, reminderMailHardError]);

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
        const currentPlan = await getCurrentSubscription(supabase, billUserId);
        setPlan(currentPlan);
        const [list, trash] = await Promise.all([
          fetchClients(supabase, ws.activeWorkspaceId),
          fetchTrashedClients(supabase, ws.activeWorkspaceId),
        ]);
        setClients(list);
        setTrashedClients(trash);
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
        }
      } catch {
        /* colonne absente tant que migration SQL non appliquée */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase, user?.id]);

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
        clientsSubtitle: "Statut des montants et relances (simulation email).",
        emptyTitle: "Aucun client pour le moment, ajoute ton premier client",
        emptyBody: "Ajoute ta première fiche client pour démarrer le suivi des paiements.",
        paid: "Payé",
        unpaid: "Impayé",
        due: "Échéance",
        remind: "Envoyer relance",
        formTitle: "Nouveau client",
        formSubtitle:
          "Nom, email, montant dû et date d'échéance — stockage local ou Supabase selon configuration.",
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
        paiementsTitle: "Synthèse paiements",
        paiementsSub: "Vue agrégée des montants marqués payés et en attente.",
      }
    : {
        upgrade: "Upgrade plan",
        modeLocal: "Local mode",
        title: "Analytics dashboard",
        clientsTitle: "Your clients",
        clientsSubtitle: "Payment status and reminders (email simulation).",
        emptyTitle: "No clients yet, add your first client",
        emptyBody: "Add your first client to start tracking your cashflow.",
        paid: "Paid",
        unpaid: "Unpaid",
        due: "Due date",
        remind: "Send reminder",
        formTitle: "Add client",
        formSubtitle: "Name, email, due amount and due date — stored locally or in Supabase.",
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
        paiementsTitle: "Payments summary",
        paiementsSub: "Aggregated view of marked paid vs pending amounts.",
      };

  const planNoticePrefix = copy.planUpdated;

  const memberReadOnly =
    Boolean(supabase) && ws.isActingAsMember && ws.memberRoleOnEffectiveAccount === "member";

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

  function handleSendReminder(client: Client) {
    setReminderToast(null);
    setReminderMailHardError(null);

    let subjectPlain: string;
    let bodyPlain: string;
    if (caps.aiReminderDrafts) {
      // Brouillon manuel (page Modèles de relance). Les entrées `templates[]` (délais J+3/7/21) ne sont pas encore liées à cette action — à brancher quand la planification par modèle existera.
      const tplWs = supabase && ws.activeWorkspaceId ? ws.activeWorkspaceId : "default";
      const st = loadReminderTemplates(locale, getMaxEmailTemplates(currentPlanId), tplWs);
      const matched = pickFirstMatchingReminderTemplate(st.templates, client.status);
      const mainBody = matched?.body ?? st.draftBody;
      subjectPlain = st.draftSubject;
      const footer =
        locale === "fr"
          ? `\n\n—\n${client.name} · ${client.amountDue} € · échéance ${client.dueDate}`
          : `\n\n—\n${client.name} · ${client.amountDue} € · due ${client.dueDate}`;
      bodyPlain = `${mainBody}${footer}`;
    } else {
      subjectPlain = `Rappel : facture en attente — ${client.name}`;
      bodyPlain = [
        `Bonjour,`,
        ``,
        `Nous vous contactons concernant un montant de ${client.amountDue} € dû pour le ${client.dueDate}.`,
        `Merci de régulariser la situation ou de nous indiquer un délai.`,
        ``,
        `Cordialement,`,
        `PayPulse`,
      ].join("\n");
    }
    const autoEffective = caps.autoReminders && autoRemindersUserEnabled;
    let extra = "";
    if (autoEffective && !caps.basicRemindersOnly && !caps.aiReminderDrafts) {
      extra =
        locale === "fr"
          ? "\n\nProchaine relance programmée dans 3 jours si aucun paiement."
          : "\n\nNext reminder scheduled in 3 days if unpaid.";
    } else if (autoEffective && caps.aiReminderDrafts) {
      extra =
        locale === "fr"
          ? "\n\nBrouillon IA généré (ton professionnel bienveillant)."
          : "\n\nAI draft generated (warm professional tone).";
    }
    const bodyWithExtra = `${bodyPlain}${extra}`;

    const to = client.email?.trim();
    if (!to) {
      setReminderMailHardError(
        locale === "fr" ? "Adresse e-mail du client manquante." : "Client email is missing.",
      );
      return;
    }

    openReminderInUserMailClient({
      to,
      subject: subjectPlain,
      body: bodyWithExtra,
      locale,
      setToast: setReminderToast,
      setHardError: setReminderMailHardError,
    });
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
        const user = authData.user;
        if (!user) return;
        const updated = await setCurrentSubscriptionPlan(supabase, user.id, requestedPlan);
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
  }, [planNoticePrefix, requestedPlan, router, supabase, ws.refreshWorkspaces]);

  return (
    <div className="dark">
      <DashboardShell
        locale={locale}
        planId={currentPlanId}
        activeNav={activeNav}
        onNav={handleNav}
        userEmail={user?.email}
        onLogout={handleLogout}
        hideTrashNav={memberReadOnly}
      >
        {envHint ? (
          <div
            className="mb-6 rounded-xl border border-sky-500/30 bg-sky-950/40 px-4 py-3 text-sm text-sky-100"
            role="status"
          >
            <strong className="font-semibold text-white">Supabase (optionnel).</strong> {envHint}{" "}
            <span className="text-sky-200/90">
              Mode local : données dans ce navigateur. Exécutez{" "}
              <code className="rounded bg-black/30 px-1 py-0.5 text-xs">supabase/schema.sql</code> pour la table{" "}
              <code className="rounded bg-black/30 px-1 py-0.5 text-xs">clients</code>.
            </span>
          </div>
        ) : null}

        {loadError && supabaseReady ? (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-100" role="alert">
            <strong className="font-semibold">Erreur Supabase.</strong> {loadError}
          </div>
        ) : null}

        {addError ? (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-100" role="alert">
            <strong className="font-semibold">Ajout impossible.</strong> {addError}
          </div>
        ) : null}

        {planNotice ? (
          <div className="mb-6 rounded-xl border border-emerald-500/35 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100" role="status">
            <strong className="font-semibold">{planNotice}</strong>
          </div>
        ) : null}

        {reminderToast ? (
          <div
            className={`mb-6 rounded-xl border px-4 py-3 text-sm ${
              reminderToast.tone === "info"
                ? "border-emerald-500/35 bg-emerald-950/40 text-emerald-100"
                : "border-amber-500/40 bg-amber-950/35 text-amber-50"
            }`}
            role="status"
          >
            <strong className="font-semibold">
              {locale === "fr" ? "Relance — " : "Reminder — "}
            </strong>
            {reminderToast.text}
          </div>
        ) : null}

        {reminderMailHardError ? (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-sm text-red-100" role="alert">
            <strong className="font-semibold">{locale === "fr" ? "Relance." : "Reminder."}</strong> {reminderMailHardError}
          </div>
        ) : null}

        {isFreePlan ? (
          <div className="mb-6 rounded-xl border border-amber-500/35 bg-amber-950/35 px-4 py-3 text-sm text-amber-50">
            <span className="font-semibold text-amber-200">FREE</span> —{" "}
            {locale === "fr" ? "Quotas : " : "Limits: "}
            <span className="tabular-nums text-white">
              {quotaDistinctEmails}/{FREE_TIER_MAX_CLIENTS}{" "}
              {locale === "fr" ? "clients distincts" : "distinct clients"}
            </span>
            {" · "}
            <span className="tabular-nums text-white">
              {clientCount}/{FREE_TIER_MAX_INVOICES} {locale === "fr" ? "factures" : "invoices"}
            </span>
            {quotaDistinctEmails >= FREE_TIER_MAX_CLIENTS && clientCount < FREE_TIER_MAX_INVOICES ? (
              <p className="mt-2 text-xs text-amber-200/90">
                {locale === "fr"
                  ? "Vous pouvez encore ajouter des factures pour les e-mails déjà connus."
                  : "You can still add invoices for emails already on file."}
              </p>
            ) : null}
          </div>
        ) : null}

        <div ref={overviewRef} className="scroll-mt-28 space-y-6">
          <DashboardAnalytics
            clients={clients}
            locale={locale}
            fullCharts={caps.fullDashboardCharts}
            advancedStats={caps.advancedStats}
          />
          <DashboardAddonTierPanels
            locale={locale}
            caps={caps}
            workspaces={supabase && ws.ready ? ws.workspaces.map((w) => ({ id: w.id, name: w.name })) : undefined}
          />
        </div>

        <div ref={relancesRef} className="scroll-mt-28 mt-10 space-y-6">
          <DashboardRelancePanel
            locale={locale}
            caps={caps}
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

        <div ref={invoicesRef} className="scroll-mt-28 mt-12 space-y-6">
          {tableLoading ? (
            <div className="pp-dashboard-card-interactive rounded-2xl border border-white/[0.08] bg-[#14141c] px-6 py-12 text-center text-sm text-slate-400 hover:border-white/15">
              {locale === "fr" ? "Chargement des factures…" : "Loading invoices…"}
            </div>
          ) : (
              <ClientList
                clients={clients}
                onSendReminder={handleSendReminder}
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

        <div ref={clientsRef} className="scroll-mt-28 mt-12">
          <AddClientForm
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

        <div ref={paiementsRef} className="scroll-mt-28 mt-12">
          <section className="pp-dashboard-card-interactive rounded-2xl border border-white/[0.08] bg-[#14141c] p-4 sm:p-6 hover:border-violet-500/25">
            <h2 className="text-base sm:text-lg font-semibold text-white">{copy.paiementsTitle}</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-400">{copy.paiementsSub}</p>
            <dl className="mt-4 sm:mt-6 grid gap-3 sm:gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {locale === "fr" ? "Encours total" : "Total outstanding"}
                </dt>
                <dd className="mt-1 text-lg sm:text-xl font-semibold tabular-nums text-white">{moneyFmt.format(totalAmountDue)}</dd>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {locale === "fr" ? "Factures payées" : "Paid invoices"}
                </dt>
                <dd className="mt-1 text-lg sm:text-xl font-semibold tabular-nums text-emerald-300">{paidCount}</dd>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {locale === "fr" ? "Taux de paiement" : "Payment rate"}
                </dt>
                <dd className="mt-1 text-lg sm:text-xl font-semibold tabular-nums text-violet-300">{paymentRate}%</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/#pricing"
                className="inline-flex rounded-full border border-violet-500/40 bg-violet-600/20 px-4 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-600/30"
              >
                {copy.upgrade}
              </Link>
              <Link
                href="/settings"
                className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08]"
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
    </div>
  );
}
