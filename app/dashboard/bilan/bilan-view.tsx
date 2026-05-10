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
import { useResolvedUiAppearance } from "@/lib/ui-theme";

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
  const [showTTable, setShowTTable] = useState(false);

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
          tTable: "Tableau en T (entreprise)",
          debit: "Débit (impayés / en attente)",
          credit: "Crédit (encaissés)",
          balance: "Solde net",
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
          tTable: "Company T-table",
          debit: "Debit (pending / unpaid)",
          credit: "Credit (paid in)",
          balance: "Net balance",
        };

  async function handleLogout() {
    const { error } = await signOut();
    if (!error) router.push("/");
  }

  const planId = plan?.planId ?? "free";
  const showThreeYearRange = canViewBilanThreeYears(planId);
  const memberReadOnly =
    Boolean(supabase) && ws.isActingAsMember && ws.memberRoleOnEffectiveAccount === "member";
  const appearance = useResolvedUiAppearance();
  const light = appearance === "light";

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
            <h2 className={`text-xl font-bold ${light ? "text-slate-900" : "text-white"}`}>{t.title}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTTable((v) => !v)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  light
                    ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    : "border-emerald-500/40 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-950/55"
                }`}
              >
                {t.tTable}
              </button>
              <Link
                href="/dashboard"
                className={`rounded-md px-1 text-sm font-semibold ${light ? "text-violet-700 hover:text-violet-600" : "text-violet-300 hover:text-violet-200"}`}
              >
                ← {t.back}
              </Link>
            </div>
          </div>

          {showTTable ? (
            <section className={`rounded-xl border p-4 sm:p-5 ${light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"}`}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  className={`rounded-lg border p-3 ${
                    light ? "border-amber-200 bg-amber-50" : "border-amber-500/35 bg-amber-950/25"
                  }`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wide ${light ? "text-amber-800" : "text-amber-200"}`}>
                    {t.debit}
                  </p>
                  <ul className={`mt-3 space-y-2 text-xs sm:text-sm ${light ? "text-slate-800" : "text-slate-200"}`}>
                    {rows
                      .filter((c) => c.status !== "paid")
                      .map((c) => (
                        <li
                          key={`d-${c.id}`}
                          className={`flex items-center justify-between gap-3 border-b pb-1.5 ${
                            light ? "border-amber-200" : "border-amber-500/25"
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="shrink-0 tabular-nums">{money.format(c.amountDue)}</span>
                        </li>
                      ))}
                  </ul>
                  <p className={`mt-3 text-sm font-semibold ${light ? "text-amber-900" : "text-amber-100"}`}>
                    {money.format(totals.pending)}
                  </p>
                </div>

                <div
                  className={`rounded-lg border p-3 ${
                    light ? "border-emerald-200 bg-emerald-50" : "border-emerald-500/35 bg-emerald-950/25"
                  }`}
                >
                  <p className={`text-xs font-semibold uppercase tracking-wide ${light ? "text-emerald-800" : "text-emerald-200"}`}>
                    {t.credit}
                  </p>
                  <ul className={`mt-3 space-y-2 text-xs sm:text-sm ${light ? "text-slate-800" : "text-slate-200"}`}>
                    {rows
                      .filter((c) => c.status === "paid")
                      .map((c) => (
                        <li
                          key={`c-${c.id}`}
                          className={`flex items-center justify-between gap-3 border-b pb-1.5 ${
                            light ? "border-emerald-200" : "border-emerald-500/25"
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                          <span className="shrink-0 tabular-nums">{money.format(c.amountDue)}</span>
                        </li>
                      ))}
                  </ul>
                  <p className={`mt-3 text-sm font-semibold ${light ? "text-emerald-900" : "text-emerald-100"}`}>
                    {money.format(totals.paid)}
                  </p>
                </div>
              </div>
              <div
                className={`mt-4 rounded-lg border p-3 text-sm ${
                  light ? "border-violet-200 bg-violet-50" : "border-violet-500/35 bg-violet-950/30"
                }`}
              >
                <span className={light ? "text-violet-800" : "text-violet-200"}>{t.balance}:</span>{" "}
                <span className={`font-semibold tabular-nums ${light ? "text-violet-900" : "text-violet-100"}`}>
                  {money.format(totals.paid - totals.pending)}
                </span>
              </div>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {rangeButtons.map(({ key: k, label }) => (
              <button
                key={k}
                type="button"
                onClick={() => setRange(k)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  range === k
                    ? "bg-violet-600 text-white"
                    : light
                      ? "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                      : "border border-white/15 bg-black/35 text-slate-200 hover:bg-white/10"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className={`rounded-xl border px-4 py-3 ${light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"}`}>
              <p className={`text-xs ${light ? "text-slate-500" : "text-slate-400"}`}>{t.sumPending}</p>
              <p className={`mt-1 text-lg font-semibold ${light ? "text-slate-900" : "text-white"}`}>{money.format(totals.pending)}</p>
            </div>
            <div className={`rounded-xl border px-4 py-3 ${light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"}`}>
              <p className={`text-xs ${light ? "text-slate-500" : "text-slate-400"}`}>{t.sumPaid}</p>
              <p className={`mt-1 text-lg font-semibold ${light ? "text-emerald-700" : "text-emerald-300"}`}>
                {money.format(totals.paid)}
              </p>
            </div>
            <div className={`rounded-xl border px-4 py-3 ${light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"}`}>
              <p className={`text-xs ${light ? "text-slate-500" : "text-slate-400"}`}>{t.rows}</p>
              <p className={`mt-1 text-lg font-semibold ${light ? "text-slate-900" : "text-white"}`}>{totals.count}</p>
            </div>
          </div>

          <div className={`overflow-x-auto rounded-xl border ${light ? "border-slate-200 bg-white" : "border-white/[0.08] bg-[#14141c]"}`}>
            {loading ? (
              <p className={`p-8 text-center text-sm ${light ? "text-slate-600" : "text-slate-400"}`}>…</p>
            ) : rows.length === 0 ? (
              <p className={`p-8 text-center text-sm ${light ? "text-slate-600" : "text-slate-400"}`}>{t.empty}</p>
            ) : (
              <table className={`min-w-full text-left text-sm ${light ? "text-slate-800" : "text-slate-200"}`}>
                <thead
                  className={`border-b text-xs uppercase tracking-wide ${light ? "border-slate-200 bg-slate-50 text-slate-600" : "border-white/10 bg-black/35 text-slate-400"}`}
                >
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
                    <tr
                      key={c.id}
                      className={`border-b ${light ? "border-slate-100 hover:bg-slate-50" : "border-white/10 hover:bg-white/[0.04]"}`}
                    >
                      <td className={`px-4 py-2.5 font-medium ${light ? "text-slate-900" : "text-white"}`}>{c.name}</td>
                      <td className={`px-4 py-2.5 ${light ? "text-slate-600" : "text-slate-400"}`}>{c.email}</td>
                      <td className="px-4 py-2.5 tabular-nums">{money.format(c.amountDue)}</td>
                      <td className="px-4 py-2.5">{c.status === "paid" ? t.paid : t.unpaid}</td>
                      <td className="px-4 py-2.5">{dateFmt.format(new Date(c.dueDate + "T12:00:00"))}</td>
                      <td className={`px-4 py-2.5 ${light ? "text-slate-600" : "text-slate-400"}`}>
                        {(() => {
                          const iso = lastPaidIso(c);
                          return iso ? dateFmt.format(new Date(iso)) : "–";
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!supabaseReady ? (
            <p className={`text-xs ${light ? "text-slate-500" : "text-slate-400"}`}>
              Mode local : le bilan utilise les factures actives de ce navigateur.
            </p>
          ) : null}
        </div>
      </DashboardShell>
    </div>
  );
}
