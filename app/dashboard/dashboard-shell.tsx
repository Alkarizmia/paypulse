"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
import { writeSidebarRailCookie } from "@/lib/dashboard-sidebar-cookie";
import { useInitialSidebarRail } from "./sidebar-rail-provider";

export type DashboardNavId = "overview" | "invoices" | "relances" | "paiements" | "clients";

function SidebarIcon({ d, extra }: { d: string; extra?: string }) {
  return (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
      {extra ? <path strokeLinecap="round" strokeLinejoin="round" d={extra} /> : null}
    </svg>
  );
}

/** Lucide-like PanelLeftClose (expanded → collapse). */
function PanelLeftCloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" strokeLinecap="round" />
      <path d="M15 9l-3 3 3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Lucide-like PanelLeftOpen (collapsed → expand). */
function PanelLeftOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" strokeLinecap="round" />
      <path d="M13 9l3 3-3 3" strokeLinecap="round" strokeLinejoin="round" />
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

function useModKeyLabel(): string {
  const [mod, setMod] = useState("Ctrl");
  useEffect(() => {
    const mac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform) || navigator.userAgent.includes("Mac");
    setMod(mac ? "⌘" : "Ctrl");
  }, []);
  return mod;
}

function DashboardWalletDropdown({
  locale,
  collapsed,
}: {
  locale: AppLocale;
  collapsed?: boolean;
}) {
  const ws = useWorkspaceOptional();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ws?.supabaseMode || !ws.ready || ws.workspaces.length === 0) return null;
  if (ws.workspaces.length <= 1 && getMaxWorkspaces(ws.planId) <= 1) return null;

  const t =
    locale === "fr"
      ? { label: "Portefeuille", settingsHint: "Gérer dans Paramètres" }
      : { label: "Wallet", settingsHint: "Manage in Settings" };

  const active = ws.workspaces.find((w) => w.id === ws.activeWorkspaceId) ?? ws.workspaces[0];

  if (collapsed) return null;

  return (
    <div className="pp-dash-sidebar__wallet relative mx-1 mt-3" ref={rootRef}>
      <button
        type="button"
        className="pp-dash-wallet-trigger flex w-full items-center justify-between gap-2 rounded-xl border border-[var(--pp-dash-line)] bg-[var(--pp-dash-card)] px-2.5 py-2 text-left outline-none transition hover:bg-[rgba(15,23,42,0.03)] focus-visible:ring-2 focus-visible:ring-indigo-500/35"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t.label}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-[var(--pp-dash-muted)]">
            {t.label}
          </span>
          <span className="block truncate text-xs font-semibold text-[var(--pp-dash-ink)]">{active?.name}</span>
        </span>
        <svg
          className={`h-3.5 w-3.5 shrink-0 text-[var(--pp-dash-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-label={t.label}
          className="pp-dash-wallet-menu absolute left-0 right-0 top-[calc(100%+0.35rem)] z-40 overflow-hidden rounded-xl border border-[var(--pp-dash-line)] bg-[var(--pp-dash-card)] py-1 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.45)]"
        >
          {ws.workspaces.map((w) => {
            const selected = w.id === ws.activeWorkspaceId;
            return (
              <button
                key={w.id}
                type="button"
                role="option"
                aria-selected={selected}
                className={`flex w-full items-center px-3 py-2 text-left text-xs font-medium transition-colors ${
                  selected
                    ? "bg-[rgba(15,23,42,0.06)] text-[var(--pp-dash-ink)]"
                    : "text-[var(--pp-dash-ink)] hover:bg-[rgba(15,23,42,0.04)]"
                }`}
                onClick={() => {
                  void ws.setActiveWorkspaceId(w.id);
                  setOpen(false);
                }}
              >
                {w.name}
              </button>
            );
          })}
          <div className="mt-1 border-t border-[var(--pp-dash-line)] pt-1">
            <Link
              href="/settings#workspaces"
              className="block px-3 py-2 text-xs font-medium text-[var(--pp-dash-link)] hover:underline"
              onClick={() => setOpen(false)}
            >
              {t.settingsHint}
            </Link>
          </div>
        </div>
      ) : null}
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
  const initialRail = useInitialSidebarRail();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarRail, setSidebarRail] = useState(initialRail);
  const [notifOpen, setNotifOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [clientsHashActive, setClientsHashActive] = useState(false);
  const [avatarBroken, setAvatarBroken] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const searchRef = useRef<HTMLAnchorElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const modKey = useModKeyLabel();
  const { items: notifications, unreadCount, markingAllRead, markOneRead, markAllRead } = useNotifications(user?.id);
  const isDashHome = pathname === "/dashboard" || pathname === "/dashboard/";
  const onRelances = pathnameNorm.startsWith("/dashboard/modeles-relance");
  const onSettings = pathnameNorm.startsWith("/settings");
  const t =
    locale === "fr"
      ? {
          plan: "Plan",
          upgrade: "Plan / Mettre à niveau",
          settings: "Paramètres",
          account: "Compte",
          myAccount: "Mon compte",
          sitePaypulss: "Site PayPulss",
          contactPage: "Contact",
          legalHub: "Infos légales",
          logout: "Déconnexion",
          notif: "Notifications",
          closeHint: "Fermer",
          noNotifications: "Aucune notification pour le moment.",
          markAllRead: "Tout marquer comme lu",
          markAllReadBusy: "Mise à jour…",
          profileAlt: "Menu compte",
          collapseSidebar: "Replier le menu (Ctrl/Cmd + B)",
          expandSidebar: "Déplier le menu (Ctrl/Cmd + B)",
          openMenu: "Ouvrir le menu",
          closeMenu: "Fermer le menu",
          searchKbd: "Rechercher",
        }
      : {
          plan: "Plan",
          upgrade: "Plan / Upgrade",
          settings: "Settings",
          account: "Account",
          myAccount: "My account",
          sitePaypulss: "PayPulss website",
          contactPage: "Contact",
          legalHub: "Legal",
          logout: "Log out",
          notif: "Notifications",
          closeHint: "Dismiss",
          noNotifications: "No notifications yet.",
          markAllRead: "Mark all as read",
          markAllReadBusy: "Updating…",
          profileAlt: "Account menu",
          collapseSidebar: "Collapse sidebar (Ctrl/Cmd + B)",
          expandSidebar: "Expand sidebar (Ctrl/Cmd + B)",
          openMenu: "Open menu",
          closeMenu: "Close menu",
          searchKbd: "Search",
        };

  const homeCopy = getDashboardHomeCopy(locale);
  const wsCtx = useWorkspaceOptional();
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

  const ownerIds = useMemo(() => {
    if (!wsCtx) return [] as string[];
    const seen = new Set<string>();
    const ids: string[] = [];
    for (const m of wsCtx.myMemberships) {
      if (!seen.has(m.ownerUserId)) {
        seen.add(m.ownerUserId);
        ids.push(m.ownerUserId);
      }
    }
    return ids;
  }, [wsCtx]);
  const showAccountSwitch = Boolean(wsCtx?.supabaseMode && user?.id && ownerIds.length > 0);
  const currentOwner = wsCtx?.effectiveOwnerUserId ?? user?.id ?? "";

  useEffect(() => {
    setAvatarBroken(false);
  }, [avatarUrl]);

  useEffect(() => {
    queueMicrotask(() => {
      setMobileMenuOpen(false);
      setNotifOpen(false);
      setAvatarOpen(false);
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

  /** Migrate legacy localStorage once if cookie was empty on SSR. */
  useEffect(() => {
    if (initialRail) return;
    try {
      const stored = window.localStorage.getItem("pp-dash-sidebar-rail");
      if (stored === "1") {
        setSidebarRail(true);
        writeSidebarRailCookie(true);
      }
    } catch {
      /* ignore */
    }
  }, [initialRail]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!avatarOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!avatarRef.current?.contains(e.target as Node)) setAvatarOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAvatarOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [avatarOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        if (window.matchMedia("(min-width: 1024px)").matches) {
          setSidebarRail((prev) => {
            const next = !prev;
            writeSidebarRailCookie(next);
            try {
              window.localStorage.setItem("pp-dash-sidebar-rail", next ? "1" : "0");
            } catch {
              /* ignore */
            }
            return next;
          });
        }
        return;
      }
      if (key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function toggleSidebarRail() {
    setSidebarRail((prev) => {
      const next = !prev;
      writeSidebarRailCookie(next);
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

  function renderFooterLinks(onNavigate?: () => void) {
    return (
      <div className="pp-dash-sidebar__footer-links mt-auto border-t border-[var(--pp-dash-line)] px-2 pt-3 pb-1">
        <Link href="/" onClick={onNavigate} className="pp-dash-sidebar__mute-link">
          {t.sitePaypulss}
        </Link>
        <Link href="/contact" onClick={onNavigate} className="pp-dash-sidebar__mute-link">
          {t.contactPage}
        </Link>
        <Link href="/legal" onClick={onNavigate} className="pp-dash-sidebar__mute-link">
          {t.legalHub}
        </Link>
      </div>
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

  const foldTitle = sidebarRail ? t.expandSidebar : t.collapseSidebar;

  return (
    <div
      className={`pp-dash-root flex min-h-screen overflow-x-hidden ${light ? "" : "pp-dash-root--dark"} ${
        sidebarRail ? "is-sidebar-rail" : ""
      }`}
    >
      <aside className="pp-dash-sidebar pp-dash-sidebar--desktop fixed inset-y-0 left-0 z-30 hidden h-dvh min-h-0 flex-col overflow-hidden px-2.5 py-4 lg:flex">
        <div className="pp-dash-sidebar__brand shrink-0 px-1">
          <div className="pp-dash-sidebar__brand-row flex items-start justify-between gap-1">
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center gap-2 rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-indigo-500/35"
              title="PayPulss"
            >
              <PayPulseLogo className="h-8 shrink-0" />
              <span className="pp-dash-sidebar__brand-text text-sm font-bold tracking-tight text-[var(--pp-dash-ink)]">
                PayPulss
              </span>
            </Link>
            <button
              type="button"
              onClick={toggleSidebarRail}
              className="pp-dash-sidebar__fold pp-dash-btn-ghost inline-flex h-8 w-8 shrink-0 items-center justify-center text-[var(--pp-dash-muted)]"
              aria-label={foldTitle}
              aria-pressed={sidebarRail}
              title={foldTitle}
            >
              <span className="pp-dash-sidebar__fold-swap relative h-4 w-4">
                <PanelLeftCloseIcon
                  className={`pp-dash-sidebar__fold-ico pp-dash-sidebar__fold-ico--close absolute inset-0 h-4 w-4 ${
                    sidebarRail ? "is-hidden" : ""
                  }`}
                />
                <PanelLeftOpenIcon
                  className={`pp-dash-sidebar__fold-ico pp-dash-sidebar__fold-ico--open absolute inset-0 h-4 w-4 ${
                    sidebarRail ? "" : "is-hidden"
                  }`}
                />
              </span>
            </button>
          </div>
          <button
            type="button"
            onClick={toggleSidebarRail}
            className="pp-dash-sidebar__fold-below pp-dash-btn-ghost mx-auto mt-2 hidden h-8 w-8 items-center justify-center text-[var(--pp-dash-muted)]"
            aria-label={foldTitle}
            aria-pressed={sidebarRail}
            title={foldTitle}
          >
            <PanelLeftOpenIcon className="h-4 w-4" />
          </button>
          <DashboardWalletDropdown locale={locale} collapsed={sidebarRail} />
          <Link
            ref={searchRef}
            href="/dashboard#clients"
            className="pp-dash-sidebar__search pp-dash-glass mx-1 mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--pp-dash-muted)] outline-none transition hover:text-[var(--pp-dash-ink)] focus-visible:ring-2 focus-visible:ring-indigo-500/35"
            title={`${homeCopy.searchPlaceholder} (${modKey}+K)`}
            aria-label={t.searchKbd}
          >
            <svg className="h-3.5 w-3.5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <span className="pp-dash-sidebar__search-text min-w-0 flex-1 truncate">{homeCopy.searchPlaceholder}</span>
            <kbd className="pp-dash-sidebar__search-kbd">{modKey}K</kbd>
          </Link>
        </div>

        <div className="pp-dashboard-sidebar-scroll mt-3 flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
          <nav className="flex flex-col gap-0.5">{renderPrimaryNav()}</nav>
          <div className="mt-auto flex flex-col">
            {renderFooterLinks()}
            <Link
              href="/#pricing"
              className="pp-dash-sidebar__plan pp-dash-glass mx-1 mb-1 mt-2 block rounded-xl px-3 py-2 outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-indigo-500/35"
              title={`${t.plan} ${planId.toUpperCase()}`}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pp-dash-muted)]">{t.plan}</p>
              <p className="text-xs font-bold tracking-wide text-[var(--pp-dash-ink)]">{planId.toUpperCase()}</p>
            </Link>
          </div>
        </div>
      </aside>

      <div className="pp-dash-main-col flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="pp-dash-header sticky top-0 z-20 flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="pp-dash-btn-ghost inline-flex h-9 w-9 items-center justify-center text-[var(--pp-dash-muted)]"
              aria-label={mobileMenuOpen ? t.closeMenu : t.openMenu}
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
            <PayPulseLogo className="h-7" />
          </div>

          <div className="ml-auto flex min-w-0 items-center justify-end gap-2 sm:gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setAvatarOpen(false);
                }}
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
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[var(--pp-dash-card)]" />
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
                      <p
                        className={
                          light
                            ? "text-xs font-semibold uppercase tracking-wide text-slate-500"
                            : "text-xs font-semibold uppercase tracking-wide text-slate-400"
                        }
                      >
                        {t.notif}
                      </p>
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
                              ? "shrink-0 text-[11px] text-indigo-700 hover:text-indigo-600"
                              : "shrink-0 text-[11px] text-indigo-300 hover:text-indigo-200"
                        }
                      >
                        {markingAllRead ? t.markAllReadBusy : t.markAllRead}
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain sm:max-h-80">
                      {notifications.length === 0 ? (
                        <p className={light ? "px-2 py-2 text-sm text-slate-500" : "px-2 py-2 text-sm text-slate-400"}>
                          {t.noNotifications}
                        </p>
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
                              } ${n.readAt ? "" : light ? "bg-indigo-50/80" : "bg-indigo-500/10"}`}
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

            <div className="relative" ref={avatarRef}>
              <button
                type="button"
                onClick={() => {
                  setAvatarOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#0b0d12] text-xs font-bold text-white ring-1 ring-[var(--pp-dash-line)] transition hover:opacity-90"
                title={displayEmail ?? t.account}
                aria-label={t.profileAlt}
                aria-haspopup="menu"
                aria-expanded={avatarOpen}
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
              </button>
              {avatarOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.4rem)] z-[62] min-w-[12.5rem] overflow-hidden rounded-xl border border-[var(--pp-dash-line)] bg-[var(--pp-dash-card)] py-1 shadow-[0_16px_40px_-20px_rgba(15,23,42,0.45)]"
                >
                  {displayEmail ? (
                    <p className="truncate border-b border-[var(--pp-dash-line)] px-3 py-2 text-[11px] text-[var(--pp-dash-muted)]">
                      {displayEmail}
                    </p>
                  ) : null}
                  {showAccountSwitch ? (
                    <div className="border-b border-[var(--pp-dash-line)] py-1">
                      <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--pp-dash-muted)]">
                        {t.account}
                      </p>
                      <button
                        type="button"
                        role="menuitem"
                        className={`flex w-full px-3 py-2 text-left text-xs font-medium ${
                          currentOwner === user?.id
                            ? "bg-[rgba(15,23,42,0.06)] text-[var(--pp-dash-ink)]"
                            : "text-[var(--pp-dash-ink)] hover:bg-[rgba(15,23,42,0.04)]"
                        }`}
                        onClick={() => {
                          wsCtx?.switchToOwnAccount();
                          setAvatarOpen(false);
                        }}
                      >
                        {t.myAccount}
                      </button>
                      {ownerIds.map((oid) => {
                        const label =
                          wsCtx?.sharedAccountSummaries.find((s) => s.ownerUserId === oid)?.displayName ?? oid;
                        return (
                          <button
                            key={oid}
                            type="button"
                            role="menuitem"
                            className={`flex w-full px-3 py-2 text-left text-xs font-medium ${
                              currentOwner === oid
                                ? "bg-[rgba(15,23,42,0.06)] text-[var(--pp-dash-ink)]"
                                : "text-[var(--pp-dash-ink)] hover:bg-[rgba(15,23,42,0.04)]"
                            }`}
                            onClick={() => {
                              wsCtx?.switchToMemberAccount(oid);
                              setAvatarOpen(false);
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <Link
                      href="/settings"
                      role="menuitem"
                      className="block px-3 py-2 text-xs font-medium text-[var(--pp-dash-ink)] hover:bg-[rgba(15,23,42,0.04)]"
                      onClick={() => setAvatarOpen(false)}
                    >
                      {t.account}
                    </Link>
                  )}
                  <Link
                    href="/#pricing"
                    role="menuitem"
                    className="block px-3 py-2 text-xs font-medium text-[var(--pp-dash-ink)] hover:bg-[rgba(15,23,42,0.04)]"
                    onClick={() => setAvatarOpen(false)}
                  >
                    {t.upgrade}
                  </Link>
                  <Link
                    href="/settings"
                    role="menuitem"
                    className="block px-3 py-2 text-xs font-medium text-[var(--pp-dash-ink)] hover:bg-[rgba(15,23,42,0.04)]"
                    onClick={() => setAvatarOpen(false)}
                  >
                    {t.settings}
                  </Link>
                  {onLogout ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="flex w-full border-t border-[var(--pp-dash-line)] px-3 py-2 text-left text-xs font-medium text-[var(--pp-dash-ink)] hover:bg-[rgba(15,23,42,0.04)]"
                      onClick={() => {
                        setAvatarOpen(false);
                        onLogout();
                      }}
                    >
                      {t.logout}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {mobileMenuOpen ? (
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-30 bg-black/45 lg:hidden"
            aria-label={t.closeMenu}
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
              className="flex items-center gap-2 rounded-lg outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-indigo-500/35"
            >
              <PayPulseLogo className="h-7" />
              <span className="text-sm font-bold tracking-tight text-[var(--pp-dash-ink)]">PayPulss</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="pp-dash-btn-ghost inline-flex h-8 w-8 items-center justify-center"
              aria-label={t.closeMenu}
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <DashboardWalletDropdown locale={locale} />
          <div className="pp-dashboard-sidebar-scroll mt-3 flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto overscroll-y-contain">
            <Link
              href="/dashboard#clients"
              onClick={() => setMobileMenuOpen(false)}
              className="pp-dash-glass mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[var(--pp-dash-muted)] outline-none transition hover:text-[var(--pp-dash-ink)] focus-visible:ring-2 focus-visible:ring-indigo-500/35"
            >
              <svg className="h-3.5 w-3.5 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
              </svg>
              <span className="min-w-0 flex-1 truncate">{homeCopy.searchPlaceholder}</span>
              <kbd className="pp-dash-sidebar__search-kbd">{modKey}K</kbd>
            </Link>
            <nav className="flex flex-col gap-1">{renderPrimaryNav(() => setMobileMenuOpen(false))}</nav>
            <div className="mt-auto flex flex-col">
              {renderFooterLinks(() => setMobileMenuOpen(false))}
              <Link
                href="/#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="pp-dash-glass mx-1 mb-1 mt-2 block rounded-xl px-3 py-2 outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-indigo-500/35"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--pp-dash-muted)]">{t.plan}</p>
                <p className="text-xs font-bold tracking-wide text-[var(--pp-dash-ink)]">{planId.toUpperCase()}</p>
              </Link>
            </div>
          </div>
        </aside>

        <main className="pp-dash-blur-in w-full min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
