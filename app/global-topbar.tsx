"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PayPulseLogo } from "@/app/dashboard/pay-pulse-logo";
import { useLocale } from "./locale-context";
import { getGlobalTopBarCopy } from "@/lib/messages/global-topbar-copy";
import { APP_LOCALES } from "@/lib/app-locale";
import { useAuth } from "./auth-context";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";
import { useHydrated } from "@/lib/use-hydrated";

const EASE = [0.22, 1, 0.36, 1] as const;

export function GlobalTopBar() {
  const { locale, setLocale } = useLocale();
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isDashboard = pathname === "/dashboard" || pathname?.startsWith("/dashboard/") || false;
  const reduce = usePreferMinimalMotion();
  const hydrated = useHydrated();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  const t = getGlobalTopBarCopy(locale);

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
      setMenuOpen(false);
      router.push("/");
      return;
    }
    window.alert(error);
  }

  const isAuthRoute =
    pathname === "/login" || pathname === "/signup" || Boolean(pathname?.startsWith("/auth"));

  if (isDashboard || isHome || isAuthRoute) {
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

  const homeMobileExtrasClass = isHome ? "hidden md:flex" : "";
  const mobileDrawerLinks = [
    { href: "#features", label: t.features },
    { href: "#demo", label: t.preview },
    { href: "#pricing", label: t.pricing },
    { href: "#faq", label: t.faq },
  ] as const;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4 sm:flex-initial">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg text-blue-600 outline-none ring-blue-500/40 focus-visible:ring-2"
            >
              <PayPulseLogo className="h-8" />
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
                      initial={false}
                      animate={hydrated ? "show" : undefined}
                      variants={desktopNavItem}
                    >
                      {t.features}
                    </motion.a>
                    <motion.a
                      href="#demo"
                      className={navLinkClass}
                      custom={1}
                      initial={false}
                      animate={hydrated ? "show" : undefined}
                      variants={desktopNavItem}
                    >
                      {t.preview}
                    </motion.a>
                    <motion.a
                      href="#pricing"
                      className={navLinkClass}
                      custom={2}
                      initial={false}
                      animate={hydrated ? "show" : undefined}
                      variants={desktopNavItem}
                    >
                      {t.pricing}
                    </motion.a>
                    <motion.a
                      href="#faq"
                      className={navLinkClass}
                      custom={3}
                      initial={false}
                      animate={hydrated ? "show" : undefined}
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

            <nav className={`flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 ${homeMobileExtrasClass}`}>
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
                className={`max-w-[180px] truncate rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-600 ${homeMobileExtrasClass}`}
                title={user.email}
              >
                {user.email}
              </span>
            )}
            <div
              className={`inline-flex max-w-full flex-wrap justify-end gap-0.5 overflow-hidden rounded-full border border-slate-200 bg-white px-0.5 py-0.5 text-[10px] font-semibold text-slate-600 sm:text-[11px] ${homeMobileExtrasClass}`}
            >
              {APP_LOCALES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={`rounded-full px-2 py-1 ${locale === code ? "bg-blue-600 text-white" : "hover:bg-slate-50"}`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isHome && menuOpen ? (
          <>
            <motion.button
              type="button"
              aria-label={t.menuClose}
              className="fixed inset-0 z-[60] bg-slate-900/35 backdrop-blur-[2px] md:hidden"
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
              aria-labelledby={`${menuId}-title`}
              className="fixed inset-0 z-[70] flex h-dvh max-h-dvh flex-col bg-white md:hidden"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: EASE }}
            >
              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-4 py-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">PayPulss</p>
                  <p id={`${menuId}-title`} className="mt-1 text-base font-semibold text-slate-900">
                    {t.menuSheetTitle}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                  onClick={() => setMenuOpen(false)}
                >
                  {t.menuClose}
                </button>
              </div>

              <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-4">
                <nav className="flex flex-col gap-1" aria-label="Marketing mobile">
                  {mobileDrawerLinks.map((item, i) => (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      className={drawerLinkClass}
                      onClick={() => setMenuOpen(false)}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.03 + i * 0.04, duration: 0.28, ease: EASE }}
                    >
                      {item.label}
                    </motion.a>
                  ))}
                </nav>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    {t.menuAccountSection}
                  </p>
                  <div className="flex flex-col gap-1">
                    <Link href="/dashboard" className={drawerLinkClass} onClick={() => setMenuOpen(false)}>
                      {t.dashboard}
                    </Link>
                    {isAuthenticated ? (
                      <>
                        <Link href="/settings" className={drawerLinkClass} onClick={() => setMenuOpen(false)}>
                          {t.settings}
                        </Link>
                        <button type="button" className={`${drawerLinkClass} w-full text-left`} onClick={() => void handleSignOut()}>
                          {t.logout}
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className={drawerLinkClass} onClick={() => setMenuOpen(false)}>
                          {t.login}
                        </Link>
                        <Link
                          href="/signup"
                          className="mt-1 block rounded-xl bg-blue-600 px-4 py-3.5 text-center text-base font-semibold text-white"
                          onClick={() => setMenuOpen(false)}
                        >
                          {t.cta}
                        </Link>
                      </>
                    )}
                  </div>
                  {isAuthenticated && user?.email ? (
                    <p className="mt-3 truncate rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600" title={user.email}>
                      {user.email}
                    </p>
                  ) : null}
                </div>

                <div className="mt-6 px-1 pb-2">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{t.menuLangSection}</p>
                  <div className="inline-flex flex-wrap gap-1 rounded-full border border-slate-200 bg-white p-1 text-[11px] font-semibold text-slate-600">
                    {APP_LOCALES.map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setLocale(code)}
                        className={`rounded-full px-3 py-1.5 ${locale === code ? "bg-blue-600 text-white" : "hover:bg-slate-50"}`}
                      >
                        {code.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="shrink-0 border-t border-slate-100 p-4 text-[11px] leading-relaxed text-slate-500">
                {t.freeTierHint}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
