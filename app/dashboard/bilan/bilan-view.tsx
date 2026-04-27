"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useWorkspace } from "@/app/workspace-context";
import { useLocale } from "@/app/locale-context";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import type { Client } from "@/app/dashboard/types";
import { eachRecognizedPayment, filterClientsInWindow } from "@/lib/dashboard-metrics";
import { canViewBilanThreeYears } from "@/lib/plans";
import { fetchClients } from "@/lib/clients";
import { getActiveLocalClients } from "@/lib/local-clients";
import { getCurrentSubscription, type UserSubscription } from "@/lib/subscriptions";
import { getSupabaseBrowserClient, isSupabaseReady } from "@/lib/supabase";

const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });

type RangeKey = "7d" | "30d" | "90d" | "365d" | "1095d";

function rangeToMs(key: RangeKey): number {
  const d: Record<RangeKey, number> = { "7d": 7, "30d": 30, "90d": 90, "365d": 365, "1095d": 1095 };
  return d[key] * 24 * 60 * 60 * 1000;
}

/** Dernière date d’encaissement connue (historique ou paid_at). */
function lastPaidIso(c: Client): string | null {
  const evs = c.paidEvents;
  if (evs && evs.length > 0) {
    let best = evs[0].at;
    let bestT = new Date(best).getTime();
    for (let i = 1; i < evs.length; i++) {
      const t = new Date(evs[i].at).getTime();
      if (!Number.isNaN(t) && t > bestT) {
        best = evs[i].at;
        bestT = t;
      }
    }
    return Number.isNaN(bestT) ? null : best;
  }
  return c.paidAt ?? null;
}

export function BilanView() {
  const { locale } = useLocale();
  const { signOut, user } = useAuth();
  const ws = useWorkspace();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const supabaseReady = isSupabaseReady();
  const [clients, setClients] = useState<Client[]>([]);
  const [plan, setPlan] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeKey>("30d");

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
        setPlan({ planId: "free", status: "trial", amountCents: 0, currency: "EUR", currentPeriodEnd: null });
      }
    } finally {
      setLoading(false);
    }
  }, [router, supabase, ws.ready, ws.activeWorkspaceId, ws.effectiveOwnerUserId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch; refresh sets loading then awaits I/O
    void refresh();
  }, [refresh]);

  const planIdForRange = plan?.planId ?? "free";
  useEffect(() => {
    if (range === "1095d" && !canViewBilanThreeYears(planIdForRange)) {
      setRange("365d");
    }
  }, [planIdForRange, range]);

  const to = useMemo(() => new Date(), []);
  const from = useMemo(() => new Date(to.getTime() - rangeToMs(range)), [to, range]);

  const rows = useMemo(() => filterClientsInWindow(clients, from, to), [clients, from, to]);

  const totals = useMemo(() => {
    const t0 = from.getTime();
    const t1 = to.getTime();
    let pending = 0;
    let paid = 0;
    for (const c of rows) {
      for (const { at, amount } of eachRecognizedPayment(c)) {
        const ts = at.getTime();
        if (ts >= t0 && ts <= t1) paid += amount;
      }
      if (c.status === "unpaid") pending += c.amountDue;
    }
    return { pending, paid, count: rows.length };
  }, [rows, from, to]);

  const t =
    locale === "fr"
      ? {
          title: "Bilan",
          back: "Retour au tableau de bord",
          range7: "7 jours",
          range30: "30 jours",
          range90: "90 jours",
          range365: "1 an",
          range1095: "3 ans",
          empty: "Aucune facture sur cette période.",
          thClient: "Client",
          thEmail: "E-mail",
          thAmount: "Montant",
          thStatus: "Statut",
          thDue: "Échéance",
          thPaid: "Payée le",
          paid: "Payé",
          unpaid: "Impayé",
          sumPending: "Total impayé (période)",
          sumPaid: "Total payé (période)",
          rows: "Lignes",
        }
      : {
          title: "Summary",
          back: "Back to dashboard",
          range7: "7 days",
          range30: "30 days",
          range90: "90 days",
          range365: "1 year",
          range1095: "3 years",
          empty: "No invoices in this period.",
          thClient: "Client",
          thEmail: "Email",
          thAmount: "Amount",
          thStatus: "Status",
          thDue: "Due",
          thPaid: "Paid on",
          paid: "Paid",
          unpaid: "Unpaid",
          sumPending: "Total unpaid (period)",
          sumPaid: "Total paid (period)",
          rows: "Rows",
        };

  async function handleLogout() {
    const { error } = await signOut();
    if (!error) router.push("/");
  }

  const planId = plan?.planId ?? "free";
  const showThreeYearRange = canViewBilanThreeYears(planId);
  const memberReadOnly =
    Boolean(supabase) && ws.isActingAsMember && ws.memberRoleOnEffectiveAccount === "member";

  const rangeButtons: { key: RangeKey; label: string }[] = (
    [
      ["7d", t.range7],
      ["30d", t.range30],
      ["90d", t.range90],
      ["365d", t.range365],
    ] as const
  ).map(([key, label]) => ({ key, label }));
  if (showThreeYearRange) {
    rangeButtons.push({ key: "1095d", label: t.range1095 });
  }

  return (
    <div className="dark">
      <DashboardShell
        locale={locale}
        planId={planId}
        activeNav="overview"
        navScrollMode={false}
        onNav={() => router.push("/dashboard")}
        userEmail={user?.email}
        onLogout={handleLogout}
        hideTrashNav={memberReadOnly}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-white">{t.title}</h2>
            <Link href="/dashboard" className="text-sm font-medium text-violet-300 hover:text-violet-200">
              ← {t.back}
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {rangeButtons.map(({ key: k, label }) => (
              <button
                key={k}
                type="button"
                onClick={() => setRange(k)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  range === k ? "bg-violet-600 text-white" : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/[0.08] bg-[#14141c] px-4 py-3">
              <p className="text-xs text-slate-500">{t.sumPending}</p>
              <p className="mt-1 text-lg font-semibold text-white">{money.format(totals.pending)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#14141c] px-4 py-3">
              <p className="text-xs text-slate-500">{t.sumPaid}</p>
              <p className="mt-1 text-lg font-semibold text-emerald-300">{money.format(totals.paid)}</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#14141c] px-4 py-3">
              <p className="text-xs text-slate-500">{t.rows}</p>
              <p className="mt-1 text-lg font-semibold text-white">{totals.count}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#14141c]">
            {loading ? (
              <p className="p-8 text-center text-sm text-slate-400">…</p>
            ) : rows.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">{t.empty}</p>
            ) : (
              <table className="min-w-full text-left text-sm text-slate-200">
                <thead className="border-b border-white/[0.08] bg-white/[0.03] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">{t.thClient}</th>
                    <th className="px-4 py-3 font-medium">{t.thEmail}</th>
                    <th className="px-4 py-3 font-medium">{t.thAmount}</th>
                    <th className="px-4 py-3 font-medium">{t.thStatus}</th>
                    <th className="px-4 py-3 font-medium">{t.thDue}</th>
                    <th className="px-4 py-3 font-medium">{t.thPaid}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-medium text-white">{c.name}</td>
                      <td className="px-4 py-2.5 text-slate-400">{c.email}</td>
                      <td className="px-4 py-2.5 tabular-nums">{money.format(c.amountDue)}</td>
                      <td className="px-4 py-2.5">{c.status === "paid" ? t.paid : t.unpaid}</td>
                      <td className="px-4 py-2.5">{dateFmt.format(new Date(c.dueDate + "T12:00:00"))}</td>
                      <td className="px-4 py-2.5 text-slate-400">
                        {(() => {
                          const iso = lastPaidIso(c);
                          return iso ? dateFmt.format(new Date(iso)) : "—";
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!supabaseReady ? (
            <p className="text-xs text-slate-500">Mode local : le bilan utilise les factures actives de ce navigateur.</p>
          ) : null}
        </div>
      </DashboardShell>
    </div>
  );
}
