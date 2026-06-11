"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/app/auth-context";
import { useLocale } from "@/app/locale-context";
import { PayPulseLogo } from "./pay-pulse-logo";
import {
  canAccessTeamPage,
  getMaxWorkspaces,
  hasReminderTemplatesEditor,
  usesAgencyWorkspaceUi,
  type PlanId,
} from "@/lib/plans";
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

type NavItem = { id: DashboardNavId; label: string; icon: ReactNode };

function navItems(locale: AppLocale): NavItem[] {
  const t = getDashboardHomeCopy(locale);
  const icon = (d: string) => (
    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d={d} />
    </svg>
  );
  return [
    {
      id: "overview",
      label: t.navHome,
      icon: icon("M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"),
    },
    {
      id: "invoices",
      label: t.navClients,
      icon: icon("M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.813-4.003M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"),
    },
    {
      id: "relances",
      label: t.navRelances,
      icon: icon("M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"),
    },
    {
      id: "paiements",
      label: t.navTreasury,
      icon: icon("M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a1.5 1.5 0 001.5-1.5V6.75a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6.75v12A1.5 1.5 0 003.75 21z"),
    },
  ];
}

const pipelineIcon = (
  <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 16.875v-3.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-8.25zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

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

const TEMPLATES_SUB_NAV_KEY = "paypulss_templates_sub_nav_open_v1";

function readTemplatesSubNavOpen(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(TEMPLATES_SUB_NAV_KEY) !== "0";
}

function persistTemplatesSubNavOpen(open: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TEMPLATES_SUB_NAV_KEY, open ? "1" : "0");
}

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

function shellNavBtn(active: boolean, light: boolean) {
  if (light) {
    return `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
      active
        ? "bg-emerald-50 text-emerald-900 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.45)]"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;
  }
  return `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
    active ? "bg-emerald-500/15 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.35)]" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
  }`;
}

function shellNavLink(active: boolean, light: boolean) {
  if (light) {
    return `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
      active
        ? "bg-emerald-50 text-emerald-900 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.45)]"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;
  }
  return `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
    active ? "bg-emerald-500/15 text-emerald-200 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.35)]" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
  }`;
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
  onNav,
  navScrollMode = true,
  userEmail,
  onLogout,
  hideTrashNav = false,
  appearance,
  children,
}: DashboardShellProps) {
  const systemDark = usePrefersColorSchemeDark();
  const [storedThemePref, setStoredThemePref] = useState<UiThemePreference>(() => readStoredUiThemePreference() ?? "light");
  const resolvedAppearance = useMemo<"light" | "dark">(() => {
    if (appearance) return appearance;
    return resolveUiTheme(storedThemePref, systemDark) === "light" ? "light" : "dark";
  }, [appearance, storedThemePref, systemDark]);
  const light = resolvedAppearance === "light";
  const { setLocale } = useLocale();
  const { user } = useAuth();
  const pathname = usePathname() ?? "";
  const pathnameNorm = pathname.replace(/\/+$/, "") || "/";
  const onTemplatesHub = pathnameNorm === "/dashboard/modeles-relance";
  const onTemplatesRegistry = pathnameNorm.startsWith("/dashboard/modeles-relance/enregistrements");
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [templatesSubOpen, setTemplatesSubOpen] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showFoldersHint, setShowFoldersHint] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const { items: notifications, unreadCount, markingAllRead, markOneRead, markAllRead } = useNotifications(user?.id);
  const isDashHome = pathname === "/dashboard" || pathname === "/dashboard/";
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
          bilan: "Bilan",
          corbeille: "Corbeille",
          modelesRelance: "Modèles de relance",
          autoReminderSaved: "Synthèse envois auto",
          expandTemplatesSub: "Afficher la synthèse envois auto",
          collapseTemplatesSub: "Masquer la synthèse envois auto",
          dossiers: "Dossiers",
          foldersHintTitle: "Nouveau : Dossiers",
          foldersHintBody: "Organisez vos clients en dossiers, ajoutez des notes et gardez tout au même endroit.",
          foldersHintCta: "Découvrir",
          closeHint: "Fermer",
          noNotifications: "Aucune notification pour le moment.",
          markAllRead: "Tout marquer comme lu",
          markAllReadBusy: "Mise à jour…",
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
          bilan: "Summary",
          corbeille: "Trash",
          modelesRelance: "Reminder templates",
          autoReminderSaved: "Auto-send summary",
          expandTemplatesSub: "Show auto-send summary",
          collapseTemplatesSub: "Hide auto-send summary",
          dossiers: "Folders",
          foldersHintTitle: "New: Folders",
          foldersHintBody: "Organize clients in folders, add notes, and keep everything in one place.",
          foldersHintCta: "Open",
          closeHint: "Dismiss",
          noNotifications: "No notifications yet.",
          markAllRead: "Mark all as read",
          markAllReadBusy: "Updating…",
        };

  const items = navItems(locale);
  const homeCopy = getDashboardHomeCopy(locale);
  const wsCtx = useWorkspaceOptional();
  const workspaceLabel =
    wsCtx?.workspaces.find((w) => w.id === wsCtx.activeWorkspaceId)?.name ??
    wsCtx?.workspaces[0]?.name ??
    null;
  const showTeamNav = canAccessTeamPage(planId);
  const onEquipe = pathnameNorm.startsWith("/dashboard/equipe");
  const onOrganisation = pathnameNorm.startsWith("/dashboard/organisation");
  const initial = (userEmail?.[0] ?? "?").toUpperCase();
  const showTemplatesNav = hasReminderTemplatesEditor(planId);
  const onIntegrations = pathnameNorm.startsWith("/dashboard/integrations");
  const onPipeline = pathnameNorm.startsWith("/dashboard/pipeline");

  function scrollOrHome(id: DashboardNavId) {
    if (navScrollMode && isDashHome) {
      onNav(id);
      return;
    }
    router.push("/dashboard");
  }

  useEffect(() => {
    queueMicrotask(() => {
      setMobileMenuOpen(false);
      setNotifOpen(false);
    });
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
    if (onTemplatesRegistry) {
      setTemplatesSubOpen(true);
      return;
    }
    setTemplatesSubOpen(readTemplatesSubNavOpen());
  }, [onTemplatesRegistry, pathnameNorm]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const seen = window.localStorage.getItem("paypulss_folders_hint_seen_v1");
    if (!seen && !pathname.startsWith("/dashboard/dossiers")) {
      queueMicrotask(() => setShowFoldersHint(true));
    }
  }, [pathname]);

  const navIconActive = light ? "text-emerald-600" : "text-emerald-300";
  const navIconIdle = "text-slate-500";

  function renderScrollableItem(item: NavItem) {
    const active = isDashHome && activeNav === item.id;
    if (navScrollMode && isDashHome) {
      return (
        <button key={item.id} type="button" onClick={() => onNav(item.id)} className={shellNavBtn(active, light)}>
          <span className={active ? navIconActive : navIconIdle}>{item.icon}</span>
          {item.label}
        </button>
      );
    }
    return (
      <Link key={item.id} href="/dashboard" className={shellNavLink(false, light)}>
        <span className={navIconIdle}>{item.icon}</span>
        {item.label}
      </Link>
    );
  }

  function toggleTemplatesSubNav() {
    setTemplatesSubOpen((prev) => {
      const next = !prev;
      persistTemplatesSubNavOpen(next);
      return next;
    });
  }

  function renderTemplatesNav(onNavigate?: () => void) {
    const subToggleClass = light
      ? "shrink-0 rounded-xl px-2 py-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      : "shrink-0 rounded-xl px-2 py-2.5 text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200";

    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-stretch gap-0.5">
          <Link
            href="/dashboard/modeles-relance"
            onClick={onNavigate}
            className={`${shellNavLink(onTemplatesHub, light)} min-w-0 flex-1`}
          >
            <span className={onTemplatesHub ? navIconActive : navIconIdle}>{templatesNavIcon}</span>
            <span className="min-w-0 flex-1 leading-snug">{t.modelesRelance}</span>
          </Link>
          <button
            type="button"
            onClick={toggleTemplatesSubNav}
            className={subToggleClass}
            aria-expanded={templatesSubOpen}
            aria-controls="dashboard-templates-subnav"
            aria-label={templatesSubOpen ? t.collapseTemplatesSub : t.expandTemplatesSub}
          >
            <svg
              className={`h-4 w-4 shrink-0 transition-transform duration-200 ${templatesSubOpen ? "" : "-rotate-90"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>
        {templatesSubOpen ? (
          <Link
            id="dashboard-templates-subnav"
            href="/dashboard/modeles-relance/enregistrements"
            onClick={onNavigate}
            className={`${shellNavLink(onTemplatesRegistry, light)} pl-9 text-xs font-medium`}
          >
            <span className={onTemplatesRegistry ? navIconActive : `${navIconIdle} opacity-80`}>{templatesNavIcon}</span>
            {t.autoReminderSaved}
          </Link>
        ) : null}
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

  return (
    <div
      className={
        light
          ? "flex min-h-screen overflow-x-hidden bg-slate-100 text-slate-900"
          : "flex min-h-screen overflow-x-hidden bg-[#08080c] text-slate-100"
      }
    >
      <aside
        className={
          light
            ? "fixed inset-y-0 left-0 z-30 hidden h-dvh min-h-0 w-56 flex-col overflow-hidden border-r border-slate-200 bg-white px-3 py-4 lg:flex"
            : "fixed inset-y-0 left-0 z-30 hidden h-dvh min-h-0 w-56 flex-col overflow-hidden border-r border-white/[0.06] bg-[#0c0c12] px-3 py-4 lg:flex"
        }
      >
        <div className="shrink-0">
          <div className="flex flex-col gap-1 px-2">
            <div className="flex items-center gap-2">
              <PayPulseLogo className="h-8 w-8 shrink-0 text-emerald-500" />
              <span className={`text-sm font-bold tracking-tight ${light ? "text-slate-900" : "text-white"}`}>PayPulss</span>
            </div>
            {workspaceLabel ? (
              <p className={`truncate pl-10 text-xs font-medium ${light ? "text-slate-500" : "text-slate-400"}`}>{workspaceLabel}</p>
            ) : null}
          </div>
          <p
            className={`mx-2 mt-4 rounded-lg border px-3 py-2 text-xs ${light ? "border-slate-200 bg-slate-50 text-slate-400" : "border-white/[0.06] bg-white/[0.03] text-slate-500"}`}
            aria-hidden
          >
            {homeCopy.searchPlaceholder}
          </p>
        </div>
        <div className="pp-dashboard-sidebar-scroll mt-2 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
        <nav className="flex flex-col gap-0.5">
          {items.slice(0, 2).map((item) => renderScrollableItem(item))}
          <Link href="/dashboard/pipeline" className={shellNavLink(onPipeline, light)}>
            <span className={onPipeline ? navIconActive : navIconIdle}>{pipelineIcon}</span>
            {homeCopy.navPipeline}
          </Link>
          {items.slice(2).map((item) => renderScrollableItem(item))}
          <Link
            href="/dashboard/bilan"
            className={shellNavLink(pathname.startsWith("/dashboard/bilan"), light)}
          >
            <span className={pathname.startsWith("/dashboard/bilan") ? navIconActive : navIconIdle}>{bilanIcon}</span>
            {t.bilan}
          </Link>
          {hideTrashNav ? null : (
            <Link
              href="/dashboard/corbeille"
              className={shellNavLink(pathname.startsWith("/dashboard/corbeille"), light)}
            >
              <span className={pathname.startsWith("/dashboard/corbeille") ? navIconActive : navIconIdle}>{trashNavIcon}</span>
              {t.corbeille}
            </Link>
          )}
          {showTemplatesNav ? renderTemplatesNav() : null}
          <Link href="/dashboard/dossiers" className={shellNavLink(pathname.startsWith("/dashboard/dossiers"), light)}>
            <span className={pathname.startsWith("/dashboard/dossiers") ? navIconActive : navIconIdle}>
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M3.75 7.5A1.5 1.5 0 015.25 6h4.19a1.5 1.5 0 011.06.44l1.06 1.06H18.75a1.5 1.5 0 011.5 1.5v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V7.5z"
                />
              </svg>
            </span>
            {t.dossiers}
          </Link>
          <p className={`mt-4 px-3 text-[10px] font-semibold uppercase tracking-wide ${light ? "text-slate-400" : "text-slate-500"}`}>
            {homeCopy.workspaceNav}
          </p>
          <Link href="/dashboard/organisation" className={shellNavLink(onOrganisation, light)}>
            <span className={onOrganisation ? navIconActive : navIconIdle}>
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.25 21h19.5M4.5 3h15M6 3v3m12-3v3M4.5 9.75h15M4.5 15h15" />
              </svg>
            </span>
            {homeCopy.navOrganization}
          </Link>
          <Link href="/dashboard/integrations" className={shellNavLink(onIntegrations, light)}>
            <span className={onIntegrations ? navIconActive : navIconIdle}>
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </span>
            {homeCopy.navIntegrations}
          </Link>
          {showTeamNav ? (
            <Link href="/dashboard/equipe" className={shellNavLink(onEquipe, light)}>
              <span className={onEquipe ? navIconActive : navIconIdle}>
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l-.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-2.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              {homeCopy.navTeam}
            </Link>
          ) : null}
        </nav>
        <Link
          href="/settings"
          className={
            light
              ? "mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              : "mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"
          }
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
        <div
          className={
            light
              ? "mt-5 border-t border-slate-200 pt-4"
              : "mt-5 border-t border-white/[0.08] pt-4"
          }
        >
          <p
            className={`mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide ${light ? "text-slate-500" : "text-slate-500"}`}
          >
            {t.sidebarResources}
          </p>
          <Link
            href="/"
            className={
              light
                ? "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                : "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"
            }
          >
            <span className="text-slate-500" aria-hidden>
              ↗
            </span>
            {t.sitePaypulss}
          </Link>
          <Link
            href="/contact"
            className={
              light
                ? "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                : "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"
            }
          >
            <span className="text-slate-500" aria-hidden>
              ✉
            </span>
            {t.contactPage}
          </Link>
          <Link
            href="/legal"
            className={
              light
                ? "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                : "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"
            }
          >
            <svg className="h-4 w-4 shrink-0 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            {t.legalHub}
          </Link>
        </div>
        <div
          className={
            light
              ? "mb-1 mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
              : "mb-1 mt-2 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
          }
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t.plan}</p>
          <p className={`text-xs font-bold ${light ? "text-violet-700" : "text-violet-300"}`}>{planId.toUpperCase()}</p>
        </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-56">
        <header
          className={
            light
              ? "sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur-md sm:px-6"
              : "sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] bg-[#08080c]/90 px-3 py-3 backdrop-blur-md sm:px-6"
          }
        >
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 lg:hidden">
              <PayPulseLogo className="h-7 w-7 text-violet-400" />
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className={
                light
                  ? "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
                  : "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] text-slate-300 transition hover:bg-white/[0.06] hover:text-white lg:hidden"
              }
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="dashboard-mobile-drawer"
            >
              {mobileMenuOpen ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                </svg>
              )}
            </button>
            <h1 className={`truncate text-lg font-semibold ${light ? "text-slate-900" : "text-white"}`}>{t.overview}</h1>
            <DashboardAccountSelect locale={locale} light={light} />
            <DashboardWorkspaceSelect locale={locale} light={light} />
          </div>
          <div className="flex w-full min-w-0 items-center justify-end gap-2 sm:w-auto sm:shrink-0 sm:gap-3">
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
                className={
                  light
                    ? "rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
                    : "rounded-full border border-white/[0.08] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                }
              >
                {t.logout}
              </button>
            ) : null}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className={
                  light
                    ? "relative rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    : "relative rounded-full border border-white/[0.08] p-2 text-slate-400 transition hover:bg-white/[0.05] hover:text-white"
                }
                aria-label={t.notif}
                aria-expanded={notifOpen}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.001 3.465-.368 5.071-1.09M15 9.75V9a3 3 0 10-6 0v.75m6 0H9"
                  />
                </svg>
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-fuchsia-500 px-1.5 text-[10px] font-bold text-white">
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
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white shadow-lg shadow-violet-900/40"
              title={userEmail ?? ""}
            >
              {initial}
            </div>
            <div
              className={
                light
                  ? "hidden flex-wrap items-center justify-end gap-0.5 overflow-hidden rounded-full border border-slate-200 text-[10px] font-semibold text-slate-600 sm:inline-flex"
                  : "hidden flex-wrap items-center justify-end gap-0.5 overflow-hidden rounded-full border border-white/10 text-[10px] font-semibold text-slate-300 sm:inline-flex"
              }
            >
              {(["fr", "en", "nl", "es"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={`px-2 py-1 ${locale === code ? "bg-violet-600 text-white" : light ? "hover:bg-slate-100" : "hover:bg-white/5"}`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </header>

        {showFoldersHint ? (
          <div className={light ? "border-b border-slate-200 bg-violet-50 px-3 py-3 sm:px-6" : "border-b border-white/[0.06] bg-violet-500/10 px-3 py-3 sm:px-6"}>
            <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-wrap items-center justify-between gap-3">
              <div>
                <p className={light ? "text-sm font-semibold text-violet-900" : "text-sm font-semibold text-violet-100"}>{t.foldersHintTitle}</p>
                <p className={light ? "text-xs text-violet-700" : "text-xs text-violet-200/90"}>{t.foldersHintBody}</p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard/dossiers"
                  className={light ? "rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700" : "rounded-lg bg-violet-500/25 px-3 py-1.5 text-xs font-semibold text-violet-100 ring-1 ring-violet-400/35 hover:bg-violet-500/35"}
                  onClick={() => {
                    if (typeof window !== "undefined") window.localStorage.setItem("paypulss_folders_hint_seen_v1", "1");
                    setShowFoldersHint(false);
                  }}
                >
                  {t.foldersHintCta}
                </Link>
                <button
                  type="button"
                  className={light ? "rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100" : "rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5"}
                  onClick={() => {
                    if (typeof window !== "undefined") window.localStorage.setItem("paypulss_folders_hint_seen_v1", "1");
                    setShowFoldersHint(false);
                  }}
                >
                  {t.closeHint}
                </button>
              </div>
            </div>
          </div>
        ) : null}

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
          className={`fixed inset-y-0 left-0 z-40 flex h-dvh min-h-0 w-72 max-w-[86vw] flex-col overflow-hidden px-3 py-5 shadow-2xl transition-transform duration-200 ease-out lg:hidden ${
            light
              ? "border-r border-slate-200 bg-white"
              : "border-r border-white/[0.08] bg-[#0c0c12]"
          } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="flex shrink-0 items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <PayPulseLogo className="h-7 w-7 text-emerald-500" />
              <span className={`text-sm font-bold tracking-tight ${light ? "text-slate-900" : "text-white"}`}>PayPulss</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className={
                light
                  ? "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  : "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
              }
              aria-label="Fermer le menu"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="pp-dashboard-sidebar-scroll mt-4 min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain">
          <nav className="flex flex-col gap-1">
            {items.slice(0, 2).map((item) => {
              const active = isDashHome && activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    scrollOrHome(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={shellNavBtn(active, light)}
                >
                  <span className={active ? navIconActive : navIconIdle}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
            <Link
              href="/dashboard/pipeline"
              onClick={() => setMobileMenuOpen(false)}
              className={shellNavLink(onPipeline, light)}
            >
              <span className={onPipeline ? navIconActive : navIconIdle}>{pipelineIcon}</span>
              {homeCopy.navPipeline}
            </Link>
            {items.slice(2).map((item) => {
              const active = isDashHome && activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    scrollOrHome(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={shellNavBtn(active, light)}
                >
                  <span className={active ? navIconActive : navIconIdle}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
            <Link
              href="/dashboard/bilan"
              onClick={() => setMobileMenuOpen(false)}
              className={shellNavLink(pathname.startsWith("/dashboard/bilan"), light)}
            >
              <span className={pathname.startsWith("/dashboard/bilan") ? navIconActive : navIconIdle}>{bilanIcon}</span>
              {t.bilan}
            </Link>
            {hideTrashNav ? null : (
              <Link
                href="/dashboard/corbeille"
                onClick={() => setMobileMenuOpen(false)}
                className={shellNavLink(pathname.startsWith("/dashboard/corbeille"), light)}
              >
                <span className={pathname.startsWith("/dashboard/corbeille") ? navIconActive : navIconIdle}>{trashNavIcon}</span>
                {t.corbeille}
              </Link>
            )}
            {showTemplatesNav ? renderTemplatesNav(() => setMobileMenuOpen(false)) : null}
            <Link
              href="/dashboard/dossiers"
              onClick={() => setMobileMenuOpen(false)}
              className={shellNavLink(pathname.startsWith("/dashboard/dossiers"), light)}
            >
              <span className={pathname.startsWith("/dashboard/dossiers") ? navIconActive : navIconIdle}>
                <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M3.75 7.5A1.5 1.5 0 015.25 6h4.19a1.5 1.5 0 011.06.44l1.06 1.06H18.75a1.5 1.5 0 011.5 1.5v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V7.5z"
                  />
                </svg>
              </span>
              {t.dossiers}
            </Link>
            <p className={`mt-3 px-3 text-[10px] font-semibold uppercase tracking-wide ${light ? "text-slate-400" : "text-slate-500"}`}>
              {homeCopy.workspaceNav}
            </p>
            <Link
              href="/dashboard/organisation"
              onClick={() => setMobileMenuOpen(false)}
              className={shellNavLink(onOrganisation, light)}
            >
              {homeCopy.navOrganization}
            </Link>
            <Link href="/dashboard/integrations" onClick={() => setMobileMenuOpen(false)} className={shellNavLink(onIntegrations, light)}>
              {homeCopy.navIntegrations}
            </Link>
            {showTeamNav ? (
              <Link href="/dashboard/equipe" onClick={() => setMobileMenuOpen(false)} className={shellNavLink(onEquipe, light)}>
                {homeCopy.navTeam}
              </Link>
            ) : null}
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={
                light
                  ? "mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                  : "mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/[0.04] hover:text-slate-200"
              }
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
            <div
              className={
                light ? "mt-4 border-t border-slate-200 pt-4" : "mt-4 border-t border-white/[0.08] pt-4"
              }
            >
              <p
                className={`mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide ${light ? "text-slate-500" : "text-slate-500"}`}
              >
                {t.sidebarResources}
              </p>
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={
                  light
                    ? "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                    : "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.04]"
                }
              >
                {t.sitePaypulss}
              </Link>
              <Link
                href="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className={
                  light
                    ? "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                    : "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.04]"
                }
              >
                {t.contactPage}
              </Link>
              <Link
                href="/legal"
                onClick={() => setMobileMenuOpen(false)}
                className={
                  light
                    ? "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                    : "flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-white/[0.04]"
                }
              >
                {t.legalHub}
              </Link>
            </div>
          </nav>
          </div>
        </aside>

        <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-3 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
