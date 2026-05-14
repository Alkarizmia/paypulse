"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PayPulseLogo } from "@/app/dashboard/pay-pulse-logo";
import { useLocale } from "./locale-context";
import { useAuth } from "./auth-context";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

export function GlobalTopBar() {
  const { locale, setLocale } = useLocale();
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isDashboard = pathname === "/dashboard" || pathname?.startsWith("/dashboard/") || false;
  const reduce = usePreferMinimalMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  const t =
    locale === "fr"
      ? {
          features: "Fonctionnalités",
          preview: "Aperçu",
          pricing: "Tarifs",
          faq: "FAQ",
          cta: "Essai gratuit",
          dashboard: "Dashboard",
          settings: "Paramètres",
          login: "Login",
          logout: "Déconnexion",
          goDashboard: "Aller au dashboard",
          marketingHome: "Accueil",
          aboutNav: "À propos",
          contactNav: "Contact",
          legalNav: "Légal",
          menuOpen: "Ouvrir le menu",
          menuClose: "Fermer le menu",
          menuSheetTitle: "Navigation",
        }
      : {
          features: "Features",
          preview: "Preview",
          pricing: "Pricing",
          faq: "FAQ",
          cta: "Try free",
          dashboard: "Dashboard",
          settings: "Settings",
          login: "Login",
          logout: "Logout",
          goDashboard: "Go to dashboard",
          marketingHome: "Home",
          aboutNav: "About",
          contactNav: "Contact",
          legalNav: "Legal",
          menuOpen: "Open menu",
          menuClose: "Close menu",
          menuSheetTitle: "Navigation",
        };

  useEffect(() => {
    const id = window.setTimeout(() => setMenuOpen(false), 0);
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function handleSignOut() {
    const { error } = await signOut();
    if (!error) {
      router.push("/");
      return;
    }
    window.alert(error);
  }

  if (isDashboard) {
    return null;
  }

  const navLinkClass =
    "rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";

  const drawerLinkClass =
    "block rounded-xl px-4 py-3.5 text-base font-medium text-slate-800 transition hover:bg-slate-100/90 active:bg-slate-200/80";

  const desktopNavItem = {
    hidden: { opacity: 0, y: -8 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.08 + i * 0.045, duration: 0.42, ease: EASE },
    }),
  };

  return (
    <div
      className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur"
      style={{ contain: "layout style" }}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 sm:flex-initial">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg text-blue-600 outline-none ring-blue-500/40 focus-visible:ring-2"
          >
            <PayPulseLogo className="h-8 w-8 shrink-0 text-blue-600" />
            <span className="truncate text-sm font-semibold tracking-tight text-slate-900">PayPulss</span>
          </Link>
          {isHome ? (
            <nav className="hidden items-center gap-0.5 md:flex" aria-label="Marketing">
              {reduce ? (
                <>
                  <a href="#features" className={navLinkClass}>
                    {t.features}
                  </a>
                  <a href="#demo" className={navLinkClass}>
                    {t.preview}
                  </a>
                  <a href="#pricing" className={navLinkClass}>
                    {t.pricing}
                  </a>
                  <a href="#faq" className={navLinkClass}>
                    {t.faq}
                  </a>
                </>
              ) : (
                <>
                  <motion.a
                    href="#features"
                    className={navLinkClass}
                    custom={0}
                    initial="hidden"
                    animate="show"
                    variants={desktopNavItem}
                  >
                    {t.features}
                  </motion.a>
                  <motion.a
                    href="#demo"
                    className={navLinkClass}
                    custom={1}
                    initial="hidden"
                    animate="show"
                    variants={desktopNavItem}
                  >
                    {t.preview}
                  </motion.a>
                  <motion.a
                    href="#pricing"
                    className={navLinkClass}
                    custom={2}
                    initial="hidden"
                    animate="show"
                    variants={desktopNavItem}
                  >
                    {t.pricing}
                  </motion.a>
                  <motion.a
                    href="#faq"
                    className={navLinkClass}
                    custom={3}
                    initial="hidden"
                    animate="show"
                    variants={desktopNavItem}
                  >
                    {t.faq}
                  </motion.a>
                </>
              )}
            </nav>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          {isHome ? (
            <button
              type="button"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white/80 text-slate-800 shadow-sm outline-none ring-violet-500/25 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-2 md:hidden"
              aria-expanded={menuOpen}
              aria-controls={menuId}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="sr-only">{menuOpen ? t.menuClose : t.menuOpen}</span>
              <span className="flex h-4 w-5 flex-col justify-center gap-1.5" aria-hidden>
                <motion.span
                  className="block h-0.5 rounded-full bg-slate-700"
                  animate={menuOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.22, ease: EASE }}
                />
                <motion.span
                  className="block h-0.5 rounded-full bg-slate-700"
                  animate={menuOpen ? { opacity: 0, scaleX: 0.2 } : { opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.18 }}
                />
                <motion.span
                  className="block h-0.5 rounded-full bg-slate-700"
                  animate={menuOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.22, ease: EASE }}
                />
              </span>
            </button>
          ) : null}

          <nav className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
            {!isHome ? (
              <>
                <Link href="/" className="rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.marketingHome}
                </Link>
                <Link href="/#features" className="hidden md:inline rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.features}
                </Link>
                <Link href="/#demo" className="hidden md:inline rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.preview}
                </Link>
                <Link href="/#pricing" className="hidden lg:inline rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.pricing}
                </Link>
                <Link href="/#faq" className="hidden xl:inline rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.faq}
                </Link>
                <Link href="/a-propos" className="hidden sm:inline rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.aboutNav}
                </Link>
                <Link href="/contact" className="rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.contactNav}
                </Link>
                <Link href="/legal" className="hidden min-[400px]:inline rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.legalNav}
                </Link>
              </>
            ) : null}
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.dashboard}
                </Link>
                <Link href="/settings" className="rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.settings}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  {t.logout}
                </button>
              </>
            ) : (
              <>
                <Link href="/dashboard" className="rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.dashboard}
                </Link>
                <Link href="/login" className="rounded-lg px-2 py-1 hover:text-slate-900">
                  {t.login}
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                >
                  {t.cta}
                </Link>
              </>
            )}
          </nav>
          {isAuthenticated && user?.email && (
            <span
              className="max-w-[180px] truncate rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600"
              title={user.email}
            >
              {user.email}
            </span>
          )}
          <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600">
            <button
              type="button"
              onClick={() => setLocale("fr")}
              className={`px-3 py-1 ${locale === "fr" ? "bg-blue-600 text-white" : "hover:bg-slate-50"}`}
            >
              FR
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`px-3 py-1 ${locale === "en" ? "bg-blue-600 text-white" : "hover:bg-slate-50"}`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isHome && menuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label={t.menuClose}
              className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-[2px] md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              id={menuId}
              role="dialog"
              aria-modal="true"
              className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,20rem)] flex-col border-l border-white/20 bg-white/95 shadow-[-12px_0_48px_-8px_rgba(15,23,42,0.18)] backdrop-blur-xl md:hidden"
              style={{
                boxShadow:
                  "inset 3px 0 0 rgba(52,211,153,0.12), inset -2px 0 0 rgba(167,139,250,0.1), -16px 0 40px -12px rgba(15,23,42,0.2)",
              }}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34, mass: 0.65 }}
            >
              <div className="border-b border-slate-100 px-4 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">PayPulss</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{t.menuSheetTitle}</p>
              </div>
              <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3" aria-label="Marketing mobile">
                {[
                  { href: "#features", label: t.features },
                  { href: "#demo", label: t.preview },
                  { href: "#pricing", label: t.pricing },
                  { href: "#faq", label: t.faq },
                ].map((item, i) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    className={drawerLinkClass}
                    onClick={() => setMenuOpen(false)}
                    initial={{ opacity: 0, x: 28 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.06, duration: 0.38, ease: EASE }}
                  >
                    {item.label}
                  </motion.a>
                ))}
              </nav>
              <div className="border-t border-slate-100 p-3 text-[11px] leading-relaxed text-slate-500">
                {locale === "fr"
                  ? "Plan gratuit : 3 clients · 5 factures · aucune carte."
                  : "Free tier: 3 clients · 5 invoices · no card."}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
