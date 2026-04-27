"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { useAuth } from "@/app/auth-context";
import { useLocale } from "@/app/locale-context";
import { PayPulseLogo } from "./pay-pulse-logo";
import { hasProReminderEditor, usesAgencyWorkspaceUi, type PlanId } from "@/lib/plans";
import { useWorkspaceOptional } from "@/app/workspace-context";

export type DashboardNavId = "overview" | "invoices" | "clients" | "relances" | "paiements";

type NavItem = { id: DashboardNavId; label: string; icon: ReactNode };

function navItems(locale: "fr" | "en"): NavItem[] {
  const t =
    locale === "fr"
      ? {
          dashboard: "Dashboard",
          invoices: "Factures",
          clients: "Clients",
          relances: "Relances",
          paiements: "Paiements",
        }
      : {
          dashboard: "Dashboard",
          invoices: "Invoices",
          clients: "Clients",
          relances: "Reminders",
          paiements: "Payments",
        };
  const icon = (d: string) => (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
    </svg>
  );
  return [
    {
      id: "overview",
      label: t.dashboard,
      icon: icon("M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"),
    },
    {
      id: "invoices",
      label: t.invoices,
      icon: icon("M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 0010.125 2.25H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"),
    },
    {
      id: "clients",
      label: t.clients,
      icon: icon("M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.813-4.003M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"),
    },
    {
      id: "relances",
      label: t.relances,
      icon: icon("M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"),
    },
    {
      id: "paiements",
      label: t.paiements,
      icon: icon("M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a1.5 1.5 0 001.5-1.5V6.75a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6.75v12A1.5 1.5 0 003.75 21z"),
    },
  ];
}

const bilanIcon = (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 16.875v-3.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-8.25zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const trashNavIcon = (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

const templatesNavIcon = (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.75}
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 0010.125 2.25H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

type DashboardShellProps = {
  locale: "fr" | "en";
  planId: PlanId;
  activeNav: DashboardNavId;
  onNav: (id: DashboardNavId) => void;
  /** Sur les sous-pages Bilan/Corbeille : liens vers l’accueil dashboard au lieu du scroll. */
  navScrollMode?: boolean;
  userEmail?: string | null;
  onLogout?: () => void;
  /** Membre invité lecture seule : masque la corbeille dans la navigation. */
  hideTrashNav?: boolean;
  children: ReactNode;
};

const shellBtn = (active: boolean) =>
  `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
    active ? "bg-violet-600/20 text-violet-200 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.35)]" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
  }`;

const shellLink = (active: boolean) =>
  `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
    active ? "bg-violet-600/20 text-violet-200 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.35)]" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
  }`;

function DashboardWorkspaceSelect({ locale }: { locale: "fr" | "en" }) {
  const ws = useWorkspaceOptional();
  if (!ws?.supabaseMode || !ws.ready || ws.workspaces.length === 0) return null;
  if (!usesAgencyWorkspaceUi(ws.planId)) return null;
  const t =
    locale === "fr"
      ? { label: "Portefeuille", settingsHint: "Gérer dans Paramètres" }
      : { label: "Wallet", settingsHint: "Manage in Settings" };
  return (
    <div className="flex min-w-0 max-w-[min(100%,14rem)] flex-col gap-0.5 sm:max-w-xs">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t.label}</label>
      <select
        value={ws.activeWorkspaceId ?? ""}
        onChange={(e) => void ws.setActiveWorkspaceId(e.target.value)}
        className="truncate rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs font-medium text-slate-100 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
        aria-label={t.label}
      >
        {ws.workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      <Link href="/settings#workspaces" className="text-[10px] text-violet-400/90 hover:text-violet-300">
        {t.settingsHint}
      </Link>
    </div>
  );
}

function DashboardAccountSelect({ locale }: { locale: "fr" | "en" }) {
  const ws = useWorkspaceOptional();
  const { user } = useAuth();
  const ownerIds = useMemo(() => {
    if (!ws) return [] as string[];
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const m of ws.myMemberships) {
      if (!seen.has(m.ownerUserId)) {
        seen.add(m.ownerUserId);
        ids.push(m.ownerUserId);
      }
    }
    return ids;
  }, [ws]);

  if (!ws?.supabaseMode || !user?.id || ownerIds.length === 0) return null;

  const current = ws.effectiveOwnerUserId ?? user.id;
  const t =
    locale === "fr"
      ? { label: "Compte", my: "Mon compte" }
      : { label: "Account", my: "My account" };

  return (
    <div className="flex min-w-0 max-w-[min(100%,14rem)] flex-col gap-0.5 sm:max-w-xs">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t.label}</label>
      <select
        value={current}
        onChange={(e) => {
          const v = e.target.value;
          if (v === user.id) ws.switchToOwnAccount();
          else ws.switchToMemberAccount(v);
        }}
        className="truncate rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs font-medium text-slate-100 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
        aria-label={t.label}
      >
        <option value={user.id}>{t.my}</option>
        {ownerIds.map((oid) => {
          const label = ws.sharedAccountSummaries.find((s) => s.ownerUserId === oid)?.displayName ?? oid;
          return (
            <option key={oid} value={oid}>
              {label}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export function DashboardShell({
  locale,
  planId,
  activeNav,
  onNav,
  navScrollMode = true,
  userEmail,
  onLogout,
  hideTrashNav = false,
  children,
}: DashboardShellProps) {
  const { setLocale } = useLocale();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const isDashHome = pathname === "/dashboard" || pathname === "/dashboard/";
  const t =
    locale === "fr"
      ? {
          overview: "Aperçu",
          plan: "Plan",
          settings: "Paramètres",
          logout: "Déconnexion",
          upgrade: "Changer de plan",
          notif: "Notifications",
          bilan: "Bilan",
          corbeille: "Corbeille",
          modelesRelance: "Modèles de relance",
        }
      : {
          overview: "Overview",
          plan: "Plan",
          settings: "Settings",
          logout: "Log out",
          upgrade: "Change plan",
          notif: "Notifications",
          bilan: "Summary",
          corbeille: "Trash",
          modelesRelance: "Reminder templates",
        };

  const items = navItems(locale);
  const initial = (userEmail?.[0] ?? "?").toUpperCase();
  const topItems = items.slice(0, 4);
  const paiementsItem = items[4];
  const showTemplatesNav = hasProReminderEditor(planId);

  function scrollOrHome(id: DashboardNavId) {
    if (navScrollMode && isDashHome) {
      onNav(id);
      return;
    }
    router.push("/dashboard");
  }

  function renderScrollableItem(item: NavItem) {
    const active = isDashHome && activeNav === item.id;
    if (navScrollMode && isDashHome) {
      return (
        <button key={item.id} type="button" onClick={() => onNav(item.id)} className={shellBtn(active)}>
          <span className={active ? "text-violet-300" : "text-slate-500"}>{item.icon}</span>
          {item.label}
        </button>
      );
    }
    return (
      <Link key={item.id} href="/dashboard" className={shellLink(false)}>
        <span className="text-slate-500">{item.icon}</span>
        {item.label}
      </Link>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#08080c] text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col border-r border-white/[0.06] bg-[#0c0c12] px-3 py-6 lg:flex">
        <div className="flex items-center gap-2 px-2">
          <PayPulseLogo className="h-8 w-8 shrink-0 text-violet-400" />
          <span className="text-sm font-bold tracking-tight text-white">PAYPULSE</span>
        </div>
        <nav className="mt-10 flex flex-1 flex-col gap-0.5">
          {topItems.map((item) => renderScrollableItem(item))}
          <Link
            href="/dashboard/bilan"
            className={shellLink(pathname.startsWith("/dashboard/bilan"))}
          >
            <span className={pathname.startsWith("/dashboard/bilan") ? "text-violet-300" : "text-slate-500"}>{bilanIcon}</span>
            {t.bilan}
          </Link>
          {renderScrollableItem(paiementsItem)}
          {hideTrashNav ? null : (
            <Link
              href="/dashboard/corbeille"
              className={shellLink(pathname.startsWith("/dashboard/corbeille"))}
            >
              <span className={pathname.startsWith("/dashboard/corbeille") ? "text-violet-300" : "text-slate-500"}>{trashNavIcon}</span>
              {t.corbeille}
            </Link>
          )}
          {showTemplatesNav ? (
            <Link
              href="/dashboard/modeles-relance"
              className={shellLink(pathname.startsWith("/dashboard/modeles-relance"))}
            >
              <span className={pathname.startsWith("/dashboard/modeles-relance") ? "text-violet-300" : "text-slate-500"}>
                {templatesNavIcon}
              </span>
              {t.modelesRelance}
            </Link>
          ) : null}
        </nav>
        <Link
          href="/settings"
          className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"
        >
          <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {t.settings}
        </Link>
        <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t.plan}</p>
          <p className="text-xs font-bold text-violet-300">{planId.toUpperCase()}</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-56">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-[#08080c]/90 px-4 py-3 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 lg:hidden">
              <PayPulseLogo className="h-7 w-7 text-violet-400" />
            </div>
            <h1 className="truncate text-lg font-semibold text-white">{t.overview}</h1>
            <DashboardAccountSelect locale={locale} />
            <DashboardWorkspaceSelect locale={locale} />
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link
              href="/#pricing"
              className="hidden rounded-full border border-violet-500/40 bg-violet-600/20 px-3 py-1.5 text-xs font-semibold text-violet-100 transition hover:bg-violet-600/30 sm:inline-flex"
            >
              {t.upgrade}
            </Link>
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                {t.logout}
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-full border border-white/[0.08] p-2 text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
              aria-label={t.notif}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.001 3.465-.368 5.071-1.09M15 9.75V9a3 3 0 10-6 0v.75m6 0H9"
                />
              </svg>
            </button>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white shadow-lg shadow-violet-900/40"
              title={userEmail ?? ""}
            >
              {initial}
            </div>
            <div className="hidden items-center overflow-hidden rounded-full border border-white/10 text-[10px] font-semibold text-slate-300 sm:inline-flex">
              <button
                type="button"
                onClick={() => setLocale("fr")}
                className={`px-2.5 py-1 ${locale === "fr" ? "bg-violet-600 text-white" : "hover:bg-white/5"}`}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => setLocale("en")}
                className={`px-2.5 py-1 ${locale === "en" ? "bg-violet-600 text-white" : "hover:bg-white/5"}`}
              >
                EN
              </button>
            </div>
          </div>
        </header>

        <div className="border-b border-white/[0.06] px-3 py-2 lg:hidden">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {topItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollOrHome(item.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  isDashHome && activeNav === item.id ? "bg-violet-600 text-white" : "bg-white/[0.06] text-slate-400"
                }`}
              >
                {item.label}
              </button>
            ))}
            <Link
              href="/dashboard/bilan"
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                pathname.startsWith("/dashboard/bilan") ? "bg-violet-600 text-white" : "bg-white/[0.06] text-slate-400"
              }`}
            >
              {t.bilan}
            </Link>
            <button
              type="button"
              onClick={() => scrollOrHome("paiements")}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                isDashHome && activeNav === "paiements" ? "bg-violet-600 text-white" : "bg-white/[0.06] text-slate-400"
              }`}
            >
              {paiementsItem.label}
            </button>
            {hideTrashNav ? null : (
              <Link
                href="/dashboard/corbeille"
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  pathname.startsWith("/dashboard/corbeille") ? "bg-violet-600 text-white" : "bg-white/[0.06] text-slate-400"
                }`}
              >
                {t.corbeille}
              </Link>
            )}
            {showTemplatesNav ? (
              <Link
                href="/dashboard/modeles-relance"
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  pathname.startsWith("/dashboard/modeles-relance") ? "bg-violet-600 text-white" : "bg-white/[0.06] text-slate-400"
                }`}
              >
                {t.modelesRelance}
              </Link>
            ) : null}
          </div>
        </div>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
