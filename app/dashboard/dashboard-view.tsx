"use client";

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
  getPlanCapabilities,
  paidPlanTier,
  usesAgencyWorkspaceUi,
  type PlanId,
} from "@/lib/plans";
import { buildManualReminderDraftFields } from "@/lib/manual-reminder-draft";
import { getProfile } from "@/lib/profile";
import { intlLocaleFor } from "@/lib/app-locale";
import { getDashboardViewCopy, withName } from "@/lib/messages/dashboard-view-copy";
import { pickQuad } from "@/lib/messages/pick";
import {
  usePrefersColorSchemeDark,
  resolveUiTheme,
  readStoredUiThemePreference,
  subscribeUiThemePreferenceChange,
  writeStoredUiThemePreference,
  type UiThemePreference,
} from "@/lib/ui-theme";
import { getSupabaseBrowserClient, getSupabaseEnvHint, isSupabaseReady } from "@/lib/supabase";
import { AddClientModal } from "./add-client-modal";
import { ClientList } from "./client-list";
import { DashboardShell, type DashboardNavId } from "./dashboard-shell";
import type { Client } from "./types";
import { useLocale } from "@/app/locale-context";
import { useMoney } from "@/app/display-currency-context";
import { useAuth } from "@/app/auth-context";
import { useWorkspace } from "@/app/workspace-context";
import {
  getCurrentSubscription,
  preferStrongerSubscriptionView,
  setCurrentSubscriptionPlan,
  shouldSkipStripeCheckoutForPlan,
  subscriptionEntitlesToPaidFeatures,
  type UserSubscription,
} from "@/lib/subscriptions";
import { buildMailtoSingleRecipient, MAILTO_HREF_SAFE_MAX } from "@/lib/mailto-build";
import { createMemberActionNotifications } from "@/lib/notifications";
import { markClientReminderSent, countClientRemindersSent } from "@/lib/client-reminder-track";
import { getDashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";
import { DashboardHomeKpi } from "./dashboard-home-kpi";
import { DashboardHomeCashChart } from "./dashboard-home-cash-chart";
import { PriorityRemindTable } from "./priority-remind-table";

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

export function DashboardView() {
  const { locale } = useLocale();
  const { signOut, user, loading: authLoading } = useAuth();
  const ws = useWorkspace();
  const [activeNav, setActiveNav] = useState<DashboardNavId>("overview");
  const overviewRef = useRef<HTMLDivElement>(null);
  const invoicesRef = useRef<HTMLDivElement>(null);
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [trashedClients, setTrashedClients] = useState<Client[]>([]);
  const [autoRemindersUserEnabled, setAutoRemindersUserEnabled] = useState(true);
  const [invoiceListCompact, setInvoiceListCompact] = useState(false);
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

  useEffect(() => {
    if (!planNotice) return;
    const id = window.setTimeout(() => setPlanNotice(null), 15000);
    return () => window.clearTimeout(id);
  }, [planNotice]);

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
        setPlan({
          planId: "free",
          status: "trial",
          amountCents: 0,
          currency: "EUR",
          currentPeriodEnd: null,
          billingInterval: null,
        });
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
          setInvoiceListCompact(p.invoiceListCompact);
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

  const money = useMoney();

  const clientCount = clients.length;

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
      formatAmount: money.format,
    });
  }, [reminderModalClient, locale, caps.aiReminderDrafts, currentPlanId, supabase, ws.activeWorkspaceId, money]);

  const remindersSentCount = useMemo(
    () => countClientRemindersSent(clients.map((c) => c.id)),
    [clients],
  );

  const homeCopy = getDashboardHomeCopy(locale);

  const closeAddClientModal = useCallback(() => {
    setAddClientModalOpen(false);
    if (typeof window !== "undefined" && window.location.hash === "#add-client") {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
  }, []);

  const openAddClientModal = useCallback(() => {
    setAddError(null);
    setAddClientModalOpen(true);
  }, []);

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      if (hash === "#add-client") {
        openAddClientModal();
        return;
      }
      if (hash === "#clients") {
        setActiveNav("invoices");
        window.requestAnimationFrame(() => {
          invoicesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
        return;
      }
      if (!hash || hash === "#overview") {
        setActiveNav("overview");
      }
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [openAddClientModal]);

  const scrollToSection = useCallback((id: DashboardNavId) => {
    const map: Partial<Record<DashboardNavId, RefObject<HTMLDivElement | null>>> = {
      overview: overviewRef,
      invoices: invoicesRef,
      clients: invoicesRef,
    };
    map[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleNav = useCallback(
    (id: DashboardNavId) => {
      if (id === "relances") {
        router.push("/dashboard/modeles-relance");
        return;
      }
      if (id === "clients") {
        openAddClientModal();
        return;
      }
      if (id === "invoices") {
        setActiveNav("invoices");
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#clients`);
        }
        scrollToSection("invoices");
        return;
      }
      setActiveNav(id);
      if (typeof window !== "undefined" && window.location.hash) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      }
      scrollToSection(id);
    },
    [scrollToSection, openAddClientModal, router],
  );

  const copy = getDashboardViewCopy(locale);

  const planNoticePrefix = copy.planUpdated;

  const memberReadOnly = ws.collaboratorNoClientMgmt;
  const invoiceReadOnly = ws.collaboratorInvoiceReadOnly;

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

  function failAdd(message: string): never {
    setAddError(message);
    throw new Error("ADD_CLIENT_FAILED");
  }

  async function handleAdd(data: Omit<Client, "id"> & { targetWorkspaceId?: string }) {
    setAddError(null);
    if (isFreePlan) {
      if (clients.length >= FREE_TIER_MAX_INVOICES) {
        failAdd(copy.freeLimitInvoices);
      }
      const emails = new Set(
        [...clients, ...trashedClients].map((c) => c.email.trim().toLowerCase()),
      );
      const nextEmail = data.email.trim().toLowerCase();
      if (!emails.has(nextEmail) && emails.size >= FREE_TIER_MAX_CLIENTS) {
        failAdd(copy.freeLimitClients);
      }
    }
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) failAdd(copy.sessionExpired);
      if (memberReadOnly) failAdd(copy.memberCannotAddClient);
      const wsId = data.targetWorkspaceId ?? ws.activeWorkspaceId;
      if (!wsId) failAdd(copy.walletNotReady);
      const ownerRowUserId = ws.effectiveOwnerUserId ?? user.id;
      try {
        const created = await insertClient(supabase, { ...data, userId: ownerRowUserId, workspaceId: wsId });
        setClients((prev) => [created, ...prev]);
        await notifyMemberAction(
          copy.clientAddedTitle,
          withName(copy.clientAddedBody, created.name),
          { clientId: created.id, action: "client_created" },
        );
      } catch (e) {
        const rawMessage =
          typeof e === "object" && e !== null && "message" in e ? String((e as { message?: unknown }).message ?? "") : "";
        if (rawMessage.toUpperCase().includes("FREE_PLAN_LIMIT_REACHED")) {
          failAdd(copy.freeLimitInvoices);
        }
        failAdd(rawMessage || copy.addClientFailed);
      }
      return;
    }

    const now = new Date().toISOString();
    const initialPaidEvents = data.status === "paid" ? [{ at: now, amount: data.amountDue }] : undefined;
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
  }

  function handleRequestSendReminder(client: Client) {
    setReminderMailHardError(null);
    setReminderToast(null);
    if (client.status !== "unpaid") return;
    const cooldownEnd = remindCooldownUntil[client.id];
    if (typeof cooldownEnd === "number" && Date.now() < cooldownEnd) return;
    if (!client.email?.trim()) {
      setReminderMailHardError(copy.clientEmailMissing);
      return;
    }
    setReminderModalClient(client);
  }

  async function handleReminderModalSend(payload: { subject: string; body: string }) {
    const client = reminderModalClient;
    if (!client) return;
    const to = client.email?.trim();
    if (!to) {
      setReminderMailHardError(copy.clientEmailMissing);
      return;
    }

    const amountLabel = money.format(client.amountDue);
    const footer = pickQuad(locale, {
      fr: `\n\n${client.name} · ${amountLabel} · échéance ${client.dueDate}`,
      en: `\n\n${client.name} · ${amountLabel} · due ${client.dueDate}`,
      nl: `\n\n${client.name} · ${amountLabel} · vervaldatum ${client.dueDate}`,
      es: `\n\n${client.name} · ${amountLabel} · vencimiento ${client.dueDate}`,
    });

    const autoEffective = caps.autoReminders && autoRemindersUserEnabled;
    let extra = "";
    if (autoEffective && !caps.basicRemindersOnly && !caps.aiReminderDrafts) {
      extra = copy.reminderScheduled3d;
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
    markClientReminderSent(client.id);
  }

  async function handleMoveToTrash(clientId: string) {
    setAddError(null);
    if (memberReadOnly) {
      setAddError(copy.memberCannotTrash);
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
          copy.trashNotificationTitle,
          withName(copy.trashNotificationBody, row.name),
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
        copy.invoicePaidNotificationTitle,
        withName(copy.invoicePaidNotificationBody, updated.name),
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
    if (invoiceReadOnly) {
      setAddError(copy.memberCannotChangeInvoices);
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
        copy.advanceCycleCreatedTitle,
        withName(copy.advanceCycleCreatedBody, created.name),
        { clientId: created.id, action: "client_advance_cycle" },
      );
      setAdvanceModal(null);
    } catch (e) {
      const raw =
        typeof e === "object" && e !== null && "message" in e ? String((e as { message?: unknown }).message ?? "") : "";
      if (raw === "CLIENT_NOT_PAID") {
        setAddError(copy.rowNotMarkedPaid);
        return;
      }
      if (raw === "CLIENT_MISSING_WORKSPACE_OR_USER") {
        setAddError(copy.incompleteWorkspaceRow);
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
    if (!supabase || !requestedPlan || authLoading) return;
    let cancelled = false;

    const applyRequestedPlan = async () => {
      try {
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData.user;
        if (!authUser) {
          if (!cancelled && requestedPlan !== "free") {
            setPlanNotice(copy.planCheckoutAuthRequired);
            router.replace("/dashboard");
          }
          return;
        }

        if (requestedPlan !== "free") {
          const { data: sess0 } = await supabase.auth.getSession();
          let token = sess0.session?.access_token;
          if (!token) {
            const { data: ref } = await supabase.auth.refreshSession();
            token = ref.session?.access_token ?? undefined;
          }
          if (!token) {
            if (!cancelled) {
              setPlanNotice(copy.planCheckoutAuthRequired);
              router.replace("/dashboard");
            }
            return;
          }
          let currentSub = await getCurrentSubscription(supabase, authUser.id);
          try {
            const resStripe = await fetch("/api/stripe/active-subscription", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (resStripe.ok) {
              const jStripe = (await resStripe.json()) as { subscription?: UserSubscription };
              if (jStripe.subscription) {
                currentSub = preferStrongerSubscriptionView(currentSub, jStripe.subscription);
              }
            }
          } catch {
            /* garde l’état Supabase */
          }
          if (shouldSkipStripeCheckoutForPlan(requestedPlan, currentSub)) {
            if (!cancelled) {
              setPlan(currentSub);
              const higher = paidPlanTier(currentSub.planId) > paidPlanTier(requestedPlan);
              const end = currentSub.currentPeriodEnd;
              setPlanNotice(
                higher
                  ? copy.planStripeDowngradeBlocked
                  : end
                    ? `${copy.planAlreadySubscribed} (${copy.planPeriodEndsLabel} ${new Date(end).toLocaleDateString(intlLocaleFor(locale))})`
                    : copy.planAlreadySubscribed,
              );
              void ws.refreshWorkspaces();
              router.replace("/dashboard");
            }
            return;
          }
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
          type CheckoutJson = { url?: string; code?: string; error?: string; missingEnv?: string[] };
          let json: CheckoutJson = {};
          try {
            json = (await res.json()) as CheckoutJson;
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
            if (res.status === 401) {
              setPlanNotice(copy.planCheckoutAuthRequired);
            } else if (res.status === 409 && json.code === "STRIPE_DOWNGRADE_BLOCKED") {
              setPlanNotice(copy.planStripeDowngradeBlocked);
            } else if (
              json.code === "STRIPE_NOT_CONFIGURED" &&
              Array.isArray(json.missingEnv) &&
              json.missingEnv.length > 0
            ) {
              setPlanNotice(`${copy.planStripeEnvIncomplete} ${json.missingEnv.join(", ")}.`);
            } else {
              setPlanNotice(copy.planCheckoutFailed);
            }
            router.replace("/dashboard");
          }
          return;
        }

        const localSub = await getCurrentSubscription(supabase, authUser.id);
        const { data: sessFree } = await supabase.auth.getSession();
        const tokenFree = sessFree.session?.access_token;
        let effective = localSub;
        if (tokenFree) {
          try {
            const resStripe = await fetch("/api/stripe/active-subscription", {
              headers: { Authorization: `Bearer ${tokenFree}` },
            });
            if (resStripe.ok) {
              const jStripe = (await resStripe.json()) as { subscription?: UserSubscription };
              if (jStripe.subscription) {
                effective = preferStrongerSubscriptionView(localSub, jStripe.subscription);
              }
            }
          } catch {
            /* ignore */
          }
        }
        if (subscriptionEntitlesToPaidFeatures(effective)) {
          if (!cancelled) {
            setPlanNotice(copy.planFreeBlockedWhileSubscribed);
            setPlan(effective);
            void ws.refreshWorkspaces();
            router.replace("/dashboard");
          }
          return;
        }

        await setCurrentSubscriptionPlan(supabase, authUser.id, requestedPlan);
        const localAfter = await getCurrentSubscription(supabase, authUser.id);
        let mergedAfter = localAfter;
        if (tokenFree) {
          try {
            const resStripe = await fetch("/api/stripe/active-subscription", {
              headers: { Authorization: `Bearer ${tokenFree}` },
            });
            if (resStripe.ok) {
              const jStripe = (await resStripe.json()) as { subscription?: UserSubscription };
              if (jStripe.subscription) {
                mergedAfter = preferStrongerSubscriptionView(localAfter, jStripe.subscription);
              }
            }
          } catch {
            /* ignore */
          }
        }
        if (!cancelled) {
          setPlan(mergedAfter);
          setPlanNotice(`${planNoticePrefix} ${mergedAfter.planId.toUpperCase()} (${mergedAfter.status})`);
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
    authLoading,
    copy.planAlreadySubscribed,
    copy.planCheckoutAuthRequired,
    copy.planCheckoutFailed,
    copy.planFreeBlockedWhileSubscribed,
    copy.planStripeDowngradeBlocked,
    copy.planPeriodEndsLabel,
    copy.planStripeEnvIncomplete,
    locale,
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
        let p = await getCurrentSubscription(supabase, user.id);
        for (let i = 0; i < 5 && p.planId === "free" && !cancelled; i++) {
          await new Promise((r) => setTimeout(r, 1200));
          if (cancelled) break;
          p = await getCurrentSubscription(supabase, user.id);
        }
        if (!cancelled) {
          setPlan(p);
          setPlanNotice(p.planId !== "free" ? copy.stripePaymentSynced : copy.stripePaymentPendingSync);
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
  }, [
    stripeQuery,
    supabase,
    user?.id,
    router,
    copy.stripePaymentSynced,
    copy.stripePaymentPendingSync,
    ws.refreshWorkspaces,
  ]);

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
            <strong className="font-semibold">{copy.addErrorStrongTitle}</strong> {addError}
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
              {reminderToast.tone === "info" ? copy.reminderToastSentInfo : copy.reminderToastWarnTitle}
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
            <strong className="font-semibold">{copy.reminderHardErrorLabel}</strong> {reminderMailHardError}
          </div>
        ) : null}

        {isFreePlan ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="font-semibold text-amber-950">FREE</span> ·{" "}
            {copy.quotasLabel}
            <span className="tabular-nums text-amber-950">
              {quotaDistinctEmails}/{FREE_TIER_MAX_CLIENTS} {copy.distinctClientsLabel}
            </span>
            {" · "}
            <span className="tabular-nums text-amber-950">
              {clientCount}/{FREE_TIER_MAX_INVOICES} {copy.invoicesLabel}
            </span>
            {quotaDistinctEmails >= FREE_TIER_MAX_CLIENTS && clientCount < FREE_TIER_MAX_INVOICES ? (
              <p className="mt-2 text-xs text-amber-800">{copy.quotaSameEmailHint}</p>
            ) : null}
          </div>
        ) : null}

        <div ref={overviewRef} id="overview" className="min-w-0 scroll-mt-28 space-y-6">
          <div className="pp-dash-blur-in flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--pp-dash-ink)] sm:text-2xl">
                {homeCopy.navHome}
              </h2>
              <p className="mt-1 text-sm text-[var(--pp-dash-muted)]">
                {homeCopy.homeGreeting}
                {user?.email ? ` · ${user.email.split("@")[0]}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openAddClientModal}
                disabled={memberReadOnly}
                className="pp-dash-btn-ink inline-flex px-4 py-2.5 text-sm disabled:opacity-50"
              >
                {homeCopy.newClient}
              </button>
              <button
                type="button"
                onClick={() => handleNav("relances")}
                className="pp-dash-btn-ghost inline-flex px-4 py-2.5 text-sm"
              >
                {homeCopy.sendReminder}
              </button>
            </div>
          </div>

          <DashboardHomeKpi
            clients={clients}
            locale={locale}
            appearance={shellAppearance}
            remindersSentCount={remindersSentCount}
            onAddClient={openAddClientModal}
            onReminders={() => handleNav("relances")}
          />

          <DashboardHomeCashChart clients={clients} locale={locale} appearance={shellAppearance} />

          <PriorityRemindTable
            clients={clients}
            locale={locale}
            appearance={shellAppearance}
            onRemind={handleRequestSendReminder}
            remindCooldownUntil={remindCooldownUntil}
            invoiceActionsDisabled={invoiceReadOnly}
          />
        </div>

        <div ref={invoicesRef} id="clients" className="min-w-0 scroll-mt-28 mt-12 space-y-6">
          {tableLoading ? (
            <div className="pp-dash-panel px-6 py-12 text-center text-sm text-[var(--pp-dash-muted)]">
              {copy.loadingInvoices}
            </div>
          ) : (
            <ClientList
              appearance={shellAppearance}
              clients={clients}
              compact={invoiceListCompact}
              formatLocale={intlLocaleFor(locale)}
              onSendReminder={handleRequestSendReminder}
              remindCooldownUntil={remindCooldownUntil}
              onDelete={handleMoveToTrash}
              onMarkPaid={handleMarkPaid}
              onAdvanceNextCycle={memberReadOnly ? undefined : openAdvanceCycleModal}
              hideDelete={memberReadOnly}
              labels={{
                title: copy.invoicesAndCasesTitle,
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
      <AddClientModal
        open={addClientModalOpen}
        appearance={shellAppearance}
        locale={locale}
        onClose={closeAddClientModal}
        onAdd={handleAdd}
        disabled={tableLoading || invoiceReadOnly}
        supabaseActive={supabaseReady}
        freeInvoiceLimitReached={freeInvoiceLimitReached}
        freeClientDistinctCount={quotaDistinctEmails}
        freeClientMax={isFreePlan ? FREE_TIER_MAX_CLIENTS : undefined}
        portfolioOptions={agencyPortfolioOptions}
        portfolioWorkspaceId={addTargetWorkspaceId ?? ws.activeWorkspaceId}
        onPortfolioChange={setAddTargetWorkspaceId}
        serverError={addClientModalOpen ? addError : null}
        labels={{
          title: copy.formTitle,
          subtitle: copy.formSubtitle,
          portfolio: copy.portfolio,
          name: copy.name,
          company: copy.company,
          domain: copy.domain,
          phone: copy.phone,
          email: copy.email,
          amount: copy.amount,
          dueDate: copy.dueDate,
          status: copy.status,
          paid: copy.paid,
          unpaid: copy.unpaid,
          submit: copy.submit,
          saving: copy.saving,
          cancel: copy.formCancel,
        }}
      />
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
