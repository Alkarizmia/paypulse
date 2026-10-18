"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/app/auth-context";
import { PayPulseLogo } from "./pay-pulse-logo";
import { getMaxWorkspaces, type PlanId } from "@/lib/plans";
import { useWorkspaceOptional } from "@/app/workspace-context";
import {
  readStoredUiThemePreference,
  resolveUiTheme,
  subscribeUiThemePreferenceChange,
  usePrefersColorSchemeDark,
  type UiThemePreference,
} from "@/lib/ui-theme";
import { formatDashboardNotificationCopy } from "@/lib/notification-display";
import { useNotifications } from "./use-notifications";
import type { AppLocale } from "@/lib/app-locale";
import { getDashboardHomeCopy } from "@/lib/messages/dashboard-home-copy";

export type DashboardNavId = "overview" | "invoices" | "relances" | "paiements" | "clients";

function SidebarIcon({ d, extra }: { d: string; extra?: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      {extra ? <path strokeLinecap="round" strokeLinejoin="round" d={extra} /> : null}
    </svg>
  );
}

const homeNavIcon = (
  <SidebarIcon d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
);

const clientsNavIcon = (
  <SidebarIcon d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
);

const relancesNavIcon = (
  <SidebarIcon d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
);

const settingsNavIcon = (
  <SidebarIcon
    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.759 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
    extra="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  />
);

type DashboardShellProps = {
  locale: AppLocale;
  planId: PlanId;
  activeNav: DashboardNavId;
  onNav: (id: DashboardNavId) => void;
  /** Sur les sous-pages Bilan/Corbeille : liens vers l’accueil dashboard au lieu du scroll. */
  navScrollMode?: boolean;
  userEmail?: string | null;
  onLogout?: () => void;
  /** Membre invité lecture seule : masque la corbeille dans la navigation. */
  hideTrashNav?: boolean;
  /** Arrière-plan et navigation : sombre (défaut) ou clair. */
  appearance?: "dark" | "light";
  children: ReactNode;
};

function shellNavLink(active: boolean) {
  return `pp-dash-nav-link${active ? " is-active" : ""}`;
}

function DashboardWorkspaceSelect({ locale, light }: { locale: AppLocale; light: boolean }) {
  const ws = useWorkspaceOptional();
  if (!ws?.supabaseMode || !ws.ready || ws.workspaces.length === 0) return null;
  if (ws.workspaces.length <= 1 && getMaxWorkspaces(ws.planId) <= 1) return null;
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
        className={
          light
            ? "truncate rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
            : "truncate rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs font-medium text-slate-100 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
        }
        aria-label={t.label}
      >
        {ws.workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
      <Link
        href="/settings#workspaces"
        className={light ? "text-[10px] text-violet-700 hover:text-violet-600" : "text-[10px] text-violet-400/90 hover:text-violet-300"}
      >
        {t.settingsHint}
      </Link>
    </div>
  );
}

function DashboardAccountSelect({ locale, light }: { locale: AppLocale; light: boolean }) {
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
        className={
          light
            ? "truncate rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-900 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
            : "truncate rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs font-medium text-slate-100 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/40"
        }
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
  onNav: _onNav,
  navScrollMode: _navScrollMode = true,
  userEmail,
  onLogout,
  hideTrashNav: _hideTrashNav = false,
  appearance,
  children,
}: DashboardShellProps) {
  void _onNav;
  void _navScrollMode;
  void _hideTrashNav;
  const systemDark = usePrefersColorSchemeDark();
  const [storedThemePref, setStoredThemePref] = useState<UiThemePreference>(() => readStoredUiThemePreference() ?? "light");
  const resolvedAppearance = useMemo<"light" | "dark">(() => {
    if (appearance) return appearance;
    return resolveUiTheme(storedThemePref, systemDark) === "light" ? "light" : "dark";
  }, [appearance, storedThemePref, systemDark]);
  const light = resolvedAppearance === "light";
  const { user } = useAuth();
  const pathname = usePathname() ?? "";
  const pathnameNorm = pathname.replace(/\/+$/, "") || "/";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarRail, setSidebarRail] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [clientsHashActive, setClientsHashActive] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const { items: notifications, unreadCount, markingAllRead, markOneRead, markAllRead } = useNotifications(user?.id);
  const isDashHome = pathname === "/dashboard" || pathname === "/dashboard/";
  const onRelances = pathnameNorm.startsWith("/dashboard/modeles-relance");
  const onSettings = pathnameNorm.startsWith("/settings");
  const t =
    locale === "fr"
      ? {
          overview: "Aperçu",
          plan: "Plan",
          settings: "Paramètres",
          sitePaypulss: "Site PayPulss",
          contactPage: "Contact",
          legalHub: "Infos légales",
          sidebarResources: "Liens utiles",
          logout: "Déconnexion",
          upgrade: "Changer de plan",
          notif: "Notifications",
          closeHint: "Fermer",
          noNotifications: "Aucune notification pour le moment.",
          markAllRead: "Tout marquer comme lu",
          markAllReadBusy: "Mise à jour…",
          profileAlt: "Photo de profil",
          collapseSidebar: "Replier le menu",
          expandSidebar: "Déplier le menu",
        }
      : {
          overview: "Overview",
          plan: "Plan",
          settings: "Settings",
          sitePaypulss: "PayPulss website",
          contactPage: "Contact",
          legalHub: "Legal",
          sidebarResources: "Shortcuts",
          logout: "Log out",
          upgrade: "Change plan",
          notif: "Notifications",
          closeHint: "Dismiss",
          noNotifications: "No notifications yet.",
          markAllRead: "Mark all as read",
          markAllReadBusy: "Updating…",
          profileAlt: "Profile photo",
          collapseSidebar: "Collapse menu",
          expandSidebar: "Expand menu",
        };

  const homeCopy = getDashboardHomeCopy(locale);
  const wsCtx = useWorkspaceOptional();
  const workspaceLabel =
    wsCtx?.workspaces.find((w) => w.id === wsCtx.activeWorkspaceId)?.name ??
    wsCtx?.workspaces[0]?.name ??
    null;
  const displayEmail = userEmail ?? user?.email ?? null;
  const initial = (displayEmail?.[0] ?? "?").toUpperCase();
  const avatarUrl = useMemo(() => {
    const meta = user?.user_metadata as Record<string, unknown> | undefined;
    const raw =
      (typeof meta?.avatar_url === "string" && meta.avatar_url) ||
      (typeof meta?.picture === "string" && meta.picture) ||
      null;
    return raw && /^https?:\/\//i.test(raw) ? raw : null;
  }, [user?.user_metadata]);
  const showAvatar = Boolean(avatarUrl) && !avatarBroken;
  const homeActive = isDashHome && !clientsHashActive && activeNav !== "invoices";
  const clientsActive = isDashHome && (clientsHashActive || activeNav === "invoices");

  useEffect(() => {
    setAvatarBroken(false);
  }, [avatarUrl]);

  useEffect(() => {
    queueMicrotask(() => {
      setMobileMenuOpen(false);
      setNotifOpen(false);
    });
  }, [pathname]);

  useEffect(() => {
    const syncHash = () => {
      setClientsHashActive(window.location.hash === "#clients");
    };
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [pathname]);

  useEffect(() => {
    let timer: number | null = null;
    const start = () => {
      if (timer !== null) return;
      timer = window.setInterval(() => setNowTs(Date.now()), 30_000);
    };
    const stop = () => {
      if (timer !== null) {
        window.clearInterval(timer);
        timer = null;
      }
    };
    const onVis = () => {
      if (document.hidden) stop();
      else {
        setNowTs(Date.now());
        start();
      }
    };
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      stop();
    };
  }, []);

  useEffect(() => subscribeUiThemePreferenceChange((pref) => setStoredThemePref(pref)), []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("pp-dash-sidebar-rail");
      if (stored === "1") setSidebarRail(true);
    } catch {
      /* ignore */
    }
  }, []);

  function toggleSidebarRail() {
    setSidebarRail((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("pp-dash-sidebar-rail", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  function renderPrimaryNav(onNavigate?: () => void) {
    return (
      <>
        <Link href="/dashboard" onClick={onNavigate} className={shellNavLink(homeActive)} title={homeCopy.navHome}>
          <span className="pp-dash-nav-ico">{homeNavIcon}</span>
          <span className="pp-dash-sidebar__label">{homeCopy.navHome}</span>
        </Link>
        <Link href="/dashboard#clients" onClick={onNavigate} className={shellNavLink(clientsActive)} title={homeCopy.navClients}>
          <span className="pp-dash-nav-ico">{clientsNavIcon}</span>
          <span className="pp-dash-sidebar__label">{homeCopy.navClients}</span>
        </Link>
        <Link href="/dashboard/modeles-relance" onClick={onNavigate} className={shellNavLink(onRelances)} title={homeCopy.navRelances}>
          <span className="pp-dash-nav-ico">{relancesNavIcon}</span>
          <span className="pp-dash-sidebar__label">{homeCopy.navRelances}</span>
        </Link>
        <Link href="/settings" onClick={onNavigate} className={shellNavLink(onSettings)} title={t.settings}>
          <span className="pp-dash-nav-ico">{settingsNavIcon}</span>
          <span className="pp-dash-sidebar__label">{t.settings}</span>
        </Link>
      </>
    );
  }

  function formatRelative(dateIso: string): string {
    const diffSec = Math.max(1, Math.floor((nowTs - new Date(dateIso).getTime()) / 1000));
    if (locale === "fr") {
      if (diffSec < 60) return `il y a ${diffSec}s`;
      const m = Math.floor(diffSec / 60);
      if (m < 60) return `il y a ${m} min`;
      const h = Math.floor(m / 60);
      if (h < 24) return h <= 1 ? "il y a 1 heure" : `il y a ${h} heures`;
      const d = Math.floor(h / 24);
      return `il y a ${d} j`;
    }
    if (diffSec < 60) return `${diffSec}s ago`;
    const m = Math.floor(diffSec / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  }

  return (
    <div
      className={`pp-dash-root flex min-h-screen overflow-x-hidden ${light ? "" : "pp-dash-root--dark"} ${
        sidebarRail ? "is-sidebar-rail" : ""
      }`}
    >
      <aside className="pp-dash-sidebar pp-dash-sidebar--desktop fixed inset-y-0 left-0 z-30 hidden h-dvh min-h-0 flex-col overflow-hidden px-3 py-4 lg:flex">
        <div className="shrink-0">
          <div className="flex items-start justify-between gap-1 px-1">
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                title="PayPulss"
              >
                <PayPulseLogo className="h-8 shrink-0" />
                <span className="pp-dash-sidebar__brand-text text-sm font-bold tracking-tight text-[var(--pp-dash-ink)]">
                  PayPulss
                </span>
              </Link>
              {workspaceLabel ? (
                <Link
                  href="/settings#workspaces"
                  className="pp-dash-sidebar__workspace truncate pl-10 text-xs font-medium text-[var(--pp-dash-muted)] outline-none transition hover:text-[var(--pp-dash-ink)] focus-visible:ring-2 focus-visible:ring-emerald-500/35"
                >
                  {workspaceLabel}
                </Link>
              ) : null}
            </div>
            <button
              type="button"
              onClick={toggleSidebarRail}
              className="pp-dash-sidebar__fold pp-dash-btn-ghost mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center text-[var(--pp-dash-muted)]"
              aria-label={sidebarRail ? t.expandSidebar : t.collapseSidebar}
              aria-pressed={sidebarRail}
              title={sidebarRail ? t.expandSidebar : t.collapseSidebar}
            >
              {/* Icône « panneau pliable » (invention PayPulss) */}
              <svg className="pp-dash-sidebar__fold-ico h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                <rect x="3.5" y="4.5" width="17" height="15" rx="3.5" stroke="currentColor" strokeWidth="1.7" />
                <path d="M9 5v14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <path
                  d="M14.2 9.2L11.4 12l2.8 2.8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <Link
            href="/dashboard#clients"
            className="pp-dash-glass mx-1 mt-4 flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--pp-dash-muted)] outline-none transition hover:text-[var(--pp-dash-ink)] focus-visible:ring-2 focus-visible:ring-emerald-500/35"
            title={homeCopy.searchPlaceholder}
          >
            <svg className="h-3.5 w-3.5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <span className="pp-dash-sidebar__search-text">{homeCopy.searchPlaceholder}</span>
          </Link>
        </div>
        <div className="pp-dashboard-sidebar-scroll mt-2 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
        <nav className="flex flex-col gap-0.5">{renderPrimaryNav()}</nav>
        <div className="pp-dash-sidebar__resources mt-5 border-t border-[var(--pp-dash-line)] pt-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--pp-dash-muted)]">
            {t.sidebarResources}
          </p>
          <Link href="/" className="pp-dash-nav-link text-xs" title={t.sitePaypulss}>
            <span aria-hidden>↗</span>
            <span className="pp-dash-sidebar__label">{t.sitePaypulss}</span>
          </Link>
          <Link href="/contact" className="pp-dash-nav-link text-xs" title={t.contactPage}>
            <span aria-hidden>✉</span>
            <span className="pp-dash-sidebar__label">{t.contactPage}</span>
          </Link>
          <Link href="/legal" className="pp-dash-nav-link text-xs" title={t.legalHub}>
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <span className="pp-dash-sidebar__label">{t.legalHub}</span>
          </Link>
        </div>
        <Link
          href="/#pricing"
          className="pp-dash-sidebar__plan pp-dash-glass mb-1 mt-2 block rounded-xl px-3 py-2 outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-emerald-500/35"
          title={`${t.plan} ${planId.toUpperCase()}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pp-dash-muted)]">{t.plan}</p>
          <p className="text-xs font-bold tracking-wide text-[var(--pp-dash-ink)]">{planId.toUpperCase()}</p>
        </Link>
        </div>
      </aside>

      <div className="pp-dash-main-col flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="pp-dash-header sticky top-0 z-20 flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 lg:hidden">
              <PayPulseLogo className="h-7" />
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="pp-dash-btn-ghost inline-flex h-9 w-9 items-center justify-center text-[var(--pp-dash-muted)] lg:hidden"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="dashboard-mobile-drawer"
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                </svg>
              )}
            </button>
            <h1 className="truncate text-lg font-semibold tracking-tight text-[var(--pp-dash-ink)]">{t.overview}</h1>
            <DashboardAccountSelect locale={locale} light={light} />
            <DashboardWorkspaceSelect locale={locale} light={light} />
          </div>
          <div className="flex w-full min-w-0 items-center justify-end gap-2 sm:w-auto sm:shrink-0 sm:gap-3">
            <Link href="/#pricing" className="pp-dash-btn-ghost hidden px-3 py-1.5 text-xs sm:inline-flex">
              {t.upgrade}
            </Link>
            {onLogout ? (
              <button type="button" onClick={onLogout} className="pp-dash-btn-ghost inline-flex px-3 py-1.5 text-xs">
                {t.logout}
              </button>
            ) : null}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="pp-dash-btn-ghost relative inline-flex p-2 text-[var(--pp-dash-muted)]"
                aria-label={t.notif}
                aria-expanded={notifOpen}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.001 3.465-.368 5.071-1.09M15 9.75V9a3 3 0 10-6 0v.75m6 0H9"
                  />
                </svg>
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-[#0b0d12] px-1.5 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </button>
              {notifOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-[60] bg-black/35 sm:hidden"
                    aria-label={t.closeHint}
                    onClick={() => setNotifOpen(false)}
                  />
                  <div
                    className={
                      light
                        ? "z-[61] flex max-h-[min(78dvh,calc(100dvh-5rem))] min-h-0 w-auto flex-col rounded-xl border border-slate-200 bg-white p-2 shadow-xl max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-16 sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-[min(92vw,360px)] sm:max-h-80"
                        : "z-[61] flex max-h-[min(78dvh,calc(100dvh-5rem))] min-h-0 w-auto flex-col rounded-xl border border-white/10 bg-[#0e1018] p-2 shadow-2xl max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-16 sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-[min(92vw,360px)] sm:max-h-80"
                    }
                  >
                  <div className="mb-2 flex shrink-0 items-center justify-between gap-2 px-1">
                    <p className={light ? "text-xs font-semibold uppercase tracking-wide text-slate-500" : "text-xs font-semibold uppercase tracking-wide text-slate-400"}>{t.notif}</p>
                    <button
                      type="button"
                      disabled={markingAllRead || unreadCount === 0}
                      onClick={() => {
                        void (async () => {
                          const ok = await markAllRead();
                          if (ok) setNotifOpen(false);
                        })();
                      }}
                      className={
                        markingAllRead || unreadCount === 0
                          ? light
                            ? "shrink-0 cursor-not-allowed text-[11px] text-slate-400"
                            : "shrink-0 cursor-not-allowed text-[11px] text-slate-500"
                          : light
                            ? "shrink-0 text-[11px] text-violet-700 hover:text-violet-600"
                            : "shrink-0 text-[11px] text-violet-300 hover:text-violet-200"
                      }
                    >
                      {markingAllRead ? t.markAllReadBusy : t.markAllRead}
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain sm:max-h-80">
                    {notifications.length === 0 ? (
                      <p className={light ? "px-2 py-2 text-sm text-slate-500" : "px-2 py-2 text-sm text-slate-400"}>{t.noNotifications}</p>
                    ) : (
                      notifications.map((n) => {
                        const { title, body } = formatDashboardNotificationCopy(n, locale);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => void markOneRead(n.id)}
                            className={`w-full rounded-lg px-2 py-2 text-left transition ${
                              light ? "hover:bg-slate-50" : "hover:bg-white/[0.04]"
                            } ${n.readAt ? "" : light ? "bg-violet-50/80" : "bg-violet-500/10"}`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className={light ? "text-sm font-semibold text-slate-900" : "text-sm font-semibold text-slate-100"}>
                                {title}
                              </p>
                              <span className={light ? "shrink-0 text-[10px] text-slate-500" : "shrink-0 text-[10px] text-slate-500"}>
                                {formatRelative(n.createdAt)}
                              </span>
                            </div>
                            <p className={light ? "mt-0.5 text-xs text-slate-600" : "mt-0.5 text-xs text-slate-300"}>{body}</p>
                          </button>
                        );
                      })
                    )}
                  </div>
                  </div>
                </>
              ) : null}
            </div>
            <Link
              href="/settings"
              className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0b0d12] text-xs font-bold text-white ring-1 ring-[var(--pp-dash-line)] transition hover:opacity-90"
              title={displayEmail ?? t.settings}
              aria-label={t.profileAlt}
            >
              {showAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- URL Google dynamique
                <img
                  src={avatarUrl!}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarBroken(true)}
                />
              ) : (
                initial
              )}
            </Link>
          </div>
        </header>

        {mobileMenuOpen ? (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/45 lg:hidden"
            aria-label="Fermer le menu mobile"
          />
        ) : null}
        <aside
          id="dashboard-mobile-drawer"
          className={`pp-dash-sidebar fixed inset-y-0 left-0 z-40 flex h-dvh min-h-0 w-72 max-w-[86vw] flex-col overflow-hidden px-3 py-5 transition-transform duration-300 ease-out lg:hidden ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="flex shrink-0 items-center justify-between px-1">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-emerald-500/35"
            >
              <PayPulseLogo className="h-7" />
              <span className="text-sm font-bold tracking-tight text-[var(--pp-dash-ink)]">PayPulss</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="pp-dash-btn-ghost inline-flex h-8 w-8 items-center justify-center"
              aria-label="Fermer le menu"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="pp-dashboard-sidebar-scroll mt-4 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
          <Link
            href="/dashboard#clients"
            onClick={() => setMobileMenuOpen(false)}
            className="pp-dash-glass mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--pp-dash-muted)] outline-none transition hover:text-[var(--pp-dash-ink)] focus-visible:ring-2 focus-visible:ring-emerald-500/35"
          >
            <svg className="h-3.5 w-3.5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <span>{homeCopy.searchPlaceholder}</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {renderPrimaryNav(() => setMobileMenuOpen(false))}
            <div className="mt-4 border-t border-[var(--pp-dash-line)] pt-4">
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--pp-dash-muted)]">
                {t.sidebarResources}
              </p>
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="pp-dash-nav-link text-xs">
                {t.sitePaypulss}
              </Link>
              <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="pp-dash-nav-link text-xs">
                {t.contactPage}
              </Link>
              <Link href="/legal" onClick={() => setMobileMenuOpen(false)} className="pp-dash-nav-link text-xs">
                {t.legalHub}
              </Link>
            </div>
            <Link
              href="/#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="pp-dash-glass mt-3 block rounded-xl px-3 py-2 outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-emerald-500/35"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pp-dash-muted)]">{t.plan}</p>
              <p className="text-xs font-bold tracking-wide text-[var(--pp-dash-ink)]">{planId.toUpperCase()}</p>
            </Link>
          </nav>
          </div>
        </aside>

        <main className="pp-dash-blur-in w-full min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
