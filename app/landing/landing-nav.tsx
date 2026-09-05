"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useAuth } from "@/app/auth-context";
import { useLocale } from "@/app/locale-context";
import { APP_LOCALES } from "@/lib/app-locale";
import { getGlobalTopBarCopy } from "@/lib/messages/global-topbar-copy";

export function LandingNav() {
  const { locale, setLocale } = useLocale();
  const { isAuthenticated } = useAuth();
  const t = getGlobalTopBarCopy(locale);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();
  const ctaHref = isAuthenticated ? "/dashboard" : "/signup";
  const ctaLabel = isAuthenticated ? t.goDashboard : t.cta;

  useEffect(() => {
    if (!open) return;
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
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#features", label: t.features },
    { href: "#apercu", label: t.preview },
    { href: "#pricing", label: t.pricing },
    { href: "#faq", label: t.faq },
  ] as const;

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
              className="text-[13px] font-medium text-[#64748B] transition-colors hover:text-[#172033]"
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
                  locale === code ? "text-[#315BCB]" : "text-[#64748B] hover:text-[#172033]"
                }`}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
          {!isAuthenticated ? (
            <Link
              href="/login"
              className="hidden text-[13px] font-medium text-[#64748B] transition-colors hover:text-[#172033] md:inline"
            >
              {t.login}
            </Link>
          ) : null}
          <Link
            href={ctaHref}
            className="pp-lp-btn hidden bg-[#315BCB] px-4 py-1.5 text-white hover:bg-[#2648a3] md:inline-flex"
          >
            {ctaLabel}
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#172033] md:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? t.menuClose : t.menuOpen}</span>
            <span className="flex flex-col gap-1.5" aria-hidden>
              <span className="block h-px w-4 bg-current" />
              <span className="block h-px w-4 bg-current" />
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div id={menuId} className="fixed inset-0 z-50 bg-[#F7F8FC] px-6 pt-6 md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">PayPulss</span>
            <button type="button" className="text-sm text-[#64748B]" onClick={() => setOpen(false)}>
              {t.menuClose}
            </button>
          </div>
          <nav className="mt-10 flex flex-col gap-5 text-lg font-medium text-[#172033]">
            {links.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-10 flex flex-col gap-3">
            {!isAuthenticated ? (
              <Link href="/login" className="text-[#64748B]" onClick={() => setOpen(false)}>
                {t.login}
              </Link>
            ) : null}
            <Link
              href={ctaHref}
              onClick={() => setOpen(false)}
              className="pp-lp-btn bg-[#315BCB] px-5 py-3 text-white"
            >
              {ctaLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
