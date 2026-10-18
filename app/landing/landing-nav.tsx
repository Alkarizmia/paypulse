"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useLocale } from "@/app/locale-context";
import { APP_LOCALES, type AppLocale } from "@/lib/app-locale";
import { getGlobalTopBarCopy } from "@/lib/messages/global-topbar-copy";
import { isShowPricing } from "@/lib/show-pricing";

const MENU_EXIT_MS = 280;

export function LandingNav({
  waitlistMode = false,
  waitlistCtaLabel,
  onWaitlistClick,
}: {
  waitlistMode?: boolean;
  waitlistCtaLabel?: string;
  onWaitlistClick?: () => void;
} = {}) {
  const { locale, setLocale } = useLocale();
  const { isAuthenticated } = useAuth();
  const t = getGlobalTopBarCopy(locale);
  const [open, setOpen] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const showPricing = isShowPricing();
  const ctaHref = isAuthenticated ? "/dashboard" : "/signup";
  const ctaLabel = waitlistMode
    ? (waitlistCtaLabel ?? t.cta)
    : isAuthenticated
      ? t.goDashboard
      : t.cta;
  const showLogin = !waitlistMode && !isAuthenticated;

  useEffect(() => {
    if (!open) {
      setMenuVisible(false);
      const exitId = window.setTimeout(() => setMenuMounted(false), MENU_EXIT_MS);
      return () => window.clearTimeout(exitId);
    }
    setMenuMounted(true);
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => setMenuVisible(true));
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [open]);

  useEffect(() => {
    if (!menuMounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuMounted]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links: { href: string; label: string }[] = [
    { href: "#features", label: t.features },
    { href: "#apercu", label: t.preview },
    ...(showPricing ? [{ href: "#pricing", label: t.pricing }] : []),
    { href: "#faq", label: t.faq },
  ];

  const ctaClassName = "pp-lp-btn hidden bg-primary px-4 py-1.5 text-white md:inline-flex";
  const ctaMobileClassName = "pp-lp-btn bg-primary px-5 py-3 text-white";

  return (
    <header className="pp-lp-nav-shell">
      <div className={`pp-lp-nav-capsule ${scrolled ? "is-scrolled" : ""}`}>
        <Link href="/" className="pp-lp-nav-brand">
          <img
            src="/branding/paypulss-official-mark.png"
            alt="PayPulss"
            width={40}
            height={36}
            className="pp-lp-nav-mark"
          />
          <span className="pp-lp-nav-wordmark">PayPulss</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Marketing">
          {links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[13px] font-medium text-text-muted transition-colors hover:text-text"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-0.5 lg:flex">
            {APP_LOCALES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLocale(code)}
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  locale === code ? "text-accent" : "text-text-muted hover:text-text"
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          {showLogin ? (
            <Link
              href="/login"
              className="hidden text-[13px] font-medium text-text-muted transition-colors hover:text-text md:inline"
            >
              {t.login}
            </Link>
          ) : null}
          {waitlistMode ? (
            <button type="button" onClick={onWaitlistClick} className={ctaClassName}>
              {ctaLabel}
            </button>
          ) : (
            <Link href={ctaHref} className={ctaClassName}>
              {ctaLabel}
            </Link>
          )}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text md:hidden"
            aria-expanded={menuVisible}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{menuVisible ? t.menuClose : t.menuOpen}</span>
            <span className="flex flex-col gap-1.5" aria-hidden>
              <span className="block h-px w-4 bg-current" />
              <span className="block h-px w-4 bg-current" />
            </span>
          </button>
        </div>
      </div>

      {menuMounted ? (
        <div
          id={menuId}
          className={`pp-lp-mobile-menu md:hidden ${menuVisible ? "pp-lp-mobile-menu--open" : ""}`}
          aria-hidden={!menuVisible}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">PayPulss</span>
            <button type="button" className="text-sm text-text-muted" onClick={() => setOpen(false)}>
              {t.menuClose}
            </button>
          </div>
          <nav className="mt-10 flex flex-col gap-5 text-lg font-medium text-text">
            {links.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-8">
            <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
              {t.menuLangSection}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {APP_LOCALES.map((code: AppLocale) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                    locale === code
                      ? "bg-primary text-white"
                      : "bg-white/70 text-text-muted ring-1 ring-border hover:text-text"
                  }`}
                >
                  {code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3">
            {showLogin ? (
              <Link href="/login" className="text-text-muted" onClick={() => setOpen(false)}>
                {t.login}
              </Link>
            ) : null}
            {waitlistMode ? (
              <button
                type="button"
                className={ctaMobileClassName}
                onClick={() => {
                  setOpen(false);
                  onWaitlistClick?.();
                }}
              >
                {ctaLabel}
              </button>
            ) : (
              <Link
                href={ctaHref}
                onClick={() => setOpen(false)}
                className={ctaMobileClassName}
              >
                {ctaLabel}
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
