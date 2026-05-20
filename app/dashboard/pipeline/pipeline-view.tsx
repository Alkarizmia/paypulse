"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useWorkspace } from "@/app/workspace-context";
import { useLocale } from "@/app/locale-context";
import { useMoney } from "@/app/display-currency-context";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { CollectionPipeline } from "@/app/dashboard/collection-pipeline";
import type { Client } from "@/app/dashboard/types";
import { markClientReminderSent } from "@/lib/client-reminder-track";
import { fetchClients } from "@/lib/clients";
import { getActiveLocalClients } from "@/lib/local-clients";
import { buildManualReminderDraftFields } from "@/lib/manual-reminder-draft";
import { getDashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";
import { getDashboardViewCopy } from "@/lib/messages/dashboard-view-copy";
import { pickQuad } from "@/lib/messages/pick";
import { buildMailtoSingleRecipient, MAILTO_HREF_SAFE_MAX } from "@/lib/mailto-build";
import { getPlanCapabilities } from "@/lib/plans";
import { getCurrentSubscription, type UserSubscription } from "@/lib/subscriptions";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useResolvedUiAppearance } from "@/lib/ui-theme";

const ReminderSendModal = dynamic(
  () => import("@/app/dashboard/reminder-send-modal").then((m) => ({ default: m.ReminderSendModal })),
  { ssr: false },
);

export function PipelineView() {
  const { locale } = useLocale();
  const money = useMoney();
  const { signOut, user } = useAuth();
  const ws = useWorkspace();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const copy = getDashboardViewCopy(locale);
  const homeCopy = getDashboardHomeCopy(locale);
  const [clients, setClients] = useState<Client[]>([]);
  const [plan, setPlan] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminderModalClient, setReminderModalClient] = useState<Client | null>(null);
  const [remindCooldownUntil, setRemindCooldownUntil] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<string | null>(null);
  const remindCooldownTimerRef = useRef<Map<string, number>>(new Map());

  const appearance = useResolvedUiAppearance();
  const light = appearance === "light";
  const planId = plan?.planId ?? "free";
  const caps = useMemo(() => getPlanCapabilities(planId), [planId]);
  const memberReadOnly = ws.collaboratorNoClientMgmt;
  const invoiceReadOnly = ws.collaboratorInvoiceReadOnly;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (supabase) {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          router.replace("/login");
          return;
        }
        const billUserId = ws.effectiveOwnerUserId ?? auth.user.id;
        if (!ws.ready || !ws.activeWorkspaceId) {
          setClients([]);
          setPlan(await getCurrentSubscription(supabase, billUserId));
          return;
        }
        const [list, sub] = await Promise.all([
          fetchClients(supabase, ws.activeWorkspaceId),
          getCurrentSubscription(supabase, billUserId),
        ]);
        setClients(list);
        setPlan(sub);
      } else {
        setClients(getActiveLocalClients());
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
  }, [router, supabase, ws.ready, ws.activeWorkspaceId, ws.effectiveOwnerUserId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(id);
  }, [toast]);

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

  const reminderModalDraft = useMemo(() => {
    if (!reminderModalClient) return null;
    const tplWs = supabase && ws.activeWorkspaceId ? ws.activeWorkspaceId : "default";
    return buildManualReminderDraftFields(reminderModalClient, {
      locale,
      aiReminderDrafts: caps.aiReminderDrafts,
      currentPlanId: planId,
      templateWorkspaceKey: tplWs,
      formatAmount: money.format,
    });
  }, [reminderModalClient, locale, caps.aiReminderDrafts, planId, supabase, ws.activeWorkspaceId, money]);

  function handleRequestSendReminder(client: Client) {
    if (invoiceReadOnly) return;
    if (client.status !== "unpaid") return;
    const cooldownEnd = remindCooldownUntil[client.id];
    if (typeof cooldownEnd === "number" && Date.now() < cooldownEnd) return;
    if (!client.email?.trim()) {
      setToast(copy.clientEmailMissing);
      return;
    }
    setReminderModalClient(client);
  }

  async function handleReminderModalSend(payload: { subject: string; body: string }) {
    const client = reminderModalClient;
    if (!client) return;
    const to = client.email?.trim();
    if (!to) {
      setToast(copy.clientEmailMissing);
      return;
    }
    const footer = pickQuad(locale, {
      fr: `\n\n${client.name} · ${client.amountDue} € · échéance ${client.dueDate}`,
      en: `\n\n${client.name} · ${client.amountDue} € · due ${client.dueDate}`,
      nl: `\n\n${client.name} · ${client.amountDue} € · vervaldatum ${client.dueDate}`,
      es: `\n\n${client.name} · ${client.amountDue} € · vencimiento ${client.dueDate}`,
    });
    const href = buildMailtoSingleRecipient(to, payload.subject, `${payload.body}${footer}`);
    if (href.length > MAILTO_HREF_SAFE_MAX) {
      setToast(copy.reminderModalMailtoTooLong);
      return;
    }
    setReminderModalClient(null);
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
    markClientReminderSent(client.id);
    startRemindCooldown(client.id);
    setToast(copy.reminderModalMailtoDone);
  }

  async function handleLogout() {
    const { error } = await signOut();
    if (!error) router.push("/");
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
        appearance={appearance}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className={`text-xl font-bold ${light ? "text-slate-900" : "text-white"}`}>{homeCopy.pipelinePageTitle}</h2>
              <p className={`mt-1 text-sm ${light ? "text-slate-600" : "text-slate-400"}`}>{homeCopy.pipelinePageIntro}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard"
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  light
                    ? "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    : "border border-white/10 text-slate-300 hover:bg-white/[0.06]"
                }`}
              >
                {homeCopy.pipelineBackHome}
              </Link>
              {!memberReadOnly ? (
                <Link
                  href="/dashboard#add-client"
                  className={`rounded-lg px-3 py-2 text-xs font-semibold text-white transition ${
                    light ? "bg-emerald-600 hover:bg-emerald-700" : "bg-emerald-600/90 hover:bg-emerald-600"
                  }`}
                >
                  {homeCopy.pipelineAddClient}
                </Link>
              ) : null}
            </div>
          </div>

          {toast ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                light ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
              }`}
              role="status"
            >
              {toast}
            </div>
          ) : null}

          {loading ? (
            <div
              className={`rounded-2xl border px-6 py-16 text-center text-sm ${
                light ? "border-slate-200 bg-white text-slate-600" : "border-white/[0.08] bg-[#14141c] text-slate-400"
              }`}
            >
              {copy.loadingInvoices}
            </div>
          ) : (
            <CollectionPipeline
              clients={clients}
              locale={locale}
              appearance={appearance}
              variant="full"
              onClientClick={(c) => {
                if (c.status === "unpaid") handleRequestSendReminder(c);
              }}
              onViewAll={() => router.push("/dashboard#invoices")}
            />
          )}

          {!loading && !memberReadOnly ? (
            <p className={`text-xs ${light ? "text-slate-500" : "text-slate-500"}`}>
              {pickQuad(locale, {
                fr: "Astuce : après une relance, la carte passe dans « Relance envoyée ». Marquez payé depuis la liste Clients.",
                en: "Tip: after a reminder, the card moves to « Reminder sent ». Mark paid from the Clients list.",
                nl: "Tip: na een herinnering verplaatst de kaart naar « Herinnering verstuurd ». Markeer betaald via Klanten.",
                es: "Consejo: tras un recordatorio, la tarjeta pasa a « Recordatorio enviado ». Marca pagado en Clientes.",
              })}
            </p>
          ) : null}
        </div>
      </DashboardShell>

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
