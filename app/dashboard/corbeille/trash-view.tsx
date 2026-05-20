"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useWorkspace } from "@/app/workspace-context";
import { useLocale } from "@/app/locale-context";
import { useMoney } from "@/app/display-currency-context";
import { intlLocaleFor } from "@/lib/app-locale";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import type { Client } from "@/app/dashboard/types";
import { fetchTrashedClients, permanentDeleteClient, restoreClient } from "@/lib/clients";
import { loadLocalClientStore, removeLocalClientById, replaceLocalClientById } from "@/lib/local-clients";
import { getCurrentSubscription, type UserSubscription } from "@/lib/subscriptions";
import { getSupabaseBrowserClient, isSupabaseReady } from "@/lib/supabase";

export function TrashView() {
  const { locale } = useLocale();
  const money = useMoney();
  const dateFmt = useMemo(() => new Intl.DateTimeFormat(intlLocaleFor(locale), { dateStyle: "medium" }), [locale]);
  const { signOut, user } = useAuth();
  const ws = useWorkspace();
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const supabaseReady = isSupabaseReady();
  const [trash, setTrash] = useState<Client[]>([]);
  const [plan, setPlan] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (supabase) {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          router.replace("/login");
          return;
        }
        const billUserId = ws.effectiveOwnerUserId ?? auth.user.id;
        if (!ws.ready || !ws.activeWorkspaceId) {
          setTrash([]);
          setPlan(await getCurrentSubscription(supabase, billUserId));
          return;
        }
        const [list, sub] = await Promise.all([
          fetchTrashedClients(supabase, ws.activeWorkspaceId),
          getCurrentSubscription(supabase, billUserId),
        ]);
        setTrash(list);
        setPlan(sub);
      } else {
        const all = loadLocalClientStore();
        setTrash(all.filter((c) => Boolean(c.deletedAt)));
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
      setError(e instanceof Error ? e.message : "Erreur");
      setTrash([]);
    } finally {
      setLoading(false);
    }
  }, [router, supabase, ws.ready, ws.activeWorkspaceId, ws.effectiveOwnerUserId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount fetch; refresh sets loading then awaits I/O
    void refresh();
  }, [refresh]);

  const t =
    locale === "fr"
      ? {
          title: "Corbeille",
          back: "Tableau de bord",
          empty: "La corbeille est vide.",
          restore: "Restaurer",
          deleteForever: "Supprimer définitivement",
          hint: "Les éléments ici ne comptent pas dans les graphiques ni le bilan. En plan Free, les e-mails en corbeille comptent encore dans la limite de 3 clients jusqu’à suppression définitive.",
        }
      : {
          title: "Trash",
          back: "Dashboard",
          empty: "Trash is empty.",
          restore: "Restore",
          deleteForever: "Delete permanently",
          hint: "Items here are excluded from charts and summary. On the Free plan, trashed emails still count toward the 3-client cap until permanently deleted.",
        };

  async function handleRestore(c: Client) {
    setError(null);
    if (!supabase) {
      replaceLocalClientById(c.id, { deletedAt: null });
      await refresh();
      return;
    }
    try {
      await restoreClient(supabase, c.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function handlePermanent(c: Client) {
    setError(null);
    if (!supabase) {
      removeLocalClientById(c.id);
      await refresh();
      return;
    }
    try {
      await permanentDeleteClient(supabase, c.id);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function handleLogout() {
    const { error: e } = await signOut();
    if (!e) router.push("/");
  }

  const planId = plan?.planId ?? "free";
  const memberReadOnly = ws.collaboratorNoClientMgmt;

  if (memberReadOnly) {
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
          hideTrashNav
        >
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-slate-300">
            {locale === "fr"
              ? "Les membres en lecture seule n’ont pas accès à la corbeille."
              : "Read-only members cannot access the trash."}
            <div className="mt-4">
              <Link href="/dashboard" className="text-violet-300 hover:text-violet-200">
                ← {t.back}
              </Link>
            </div>
          </div>
        </DashboardShell>
      </div>
    );
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
        hideTrashNav={false}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-white">{t.title}</h2>
            <Link href="/dashboard" className="text-sm font-medium text-violet-300 hover:text-violet-200">
              ← {t.back}
            </Link>
          </div>
          <p className="text-sm text-slate-400">{t.hint}</p>
          {error ? (
            <div className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-2 text-sm text-red-100">{error}</div>
          ) : null}

          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-400">…</p>
            ) : trash.length === 0 ? (
              <p className="text-sm text-slate-400">{t.empty}</p>
            ) : (
              trash.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-[#14141c] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.email}</p>
                    <p className="mt-1 text-sm tabular-nums text-slate-200">{money.format(c.amountDue)}</p>
                    <p className="text-xs text-slate-500">
                      {c.deletedAt ? dateFmt.format(new Date(c.deletedAt)) : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRestore(c)}
                      className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500"
                    >
                      {t.restore}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handlePermanent(c)}
                      className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-950/50"
                    >
                      {t.deleteForever}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {!supabaseReady ? <p className="text-xs text-slate-500">Corbeille locale (navigateur).</p> : null}
        </div>
      </DashboardShell>
    </div>
  );
}
