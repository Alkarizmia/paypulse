"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PayPulseLogo } from "@/app/dashboard/pay-pulse-logo";
import { useLocale } from "@/app/locale-context";
import { APP_LOCALES } from "@/lib/app-locale";
import { getGlobalTopBarCopy } from "@/lib/messages/global-topbar-copy";
import "@/app/landing/landing-premium.css";

export function AuthPageShell({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "login" | "signup";
}) {
  const { locale, setLocale } = useLocale();
  const t = getGlobalTopBarCopy(locale);
  const ctaHref = variant === "login" ? "/signup" : "/login";
  const ctaLabel = variant === "login" ? t.cta : t.login;

  return (
    <div className="pp-lp pp-auth-page">
      <div className="pp-lp-atmosphere" aria-hidden>
        <div className="pp-lp-hero-fx">
          <span className="pp-lp-halo pp-lp-halo--tl" />
          <span className="pp-lp-halo pp-lp-halo--tr" />
          <span className="pp-lp-halo pp-lp-halo--center" />
        </div>
      </div>

      <header className="pp-lp-nav-shell">
        <div className="pp-lp-nav-capsule">
          <Link href="/" className="pp-lp-nav-brand">
            <PayPulseLogo className="pp-lp-nav-mark" />
            <span className="pp-lp-nav-wordmark">PayPulss</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-0.5">
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
            <Link href={ctaHref} className="pp-lp-btn bg-primary px-4 py-1.5 text-white hover:bg-bg-dark">
              {ctaLabel}
            </Link>
          </div>
        </div>
      </header>

      <main className="pp-auth-stage">{children}</main>
    </div>
  );
}
