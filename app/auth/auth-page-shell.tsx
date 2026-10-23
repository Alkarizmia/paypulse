"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PayPulseLogo } from "@/app/dashboard/pay-pulse-logo";
import { getGlobalTopBarCopy } from "@/lib/messages/global-topbar-copy";
import "@/app/landing/landing-premium.css";

export function AuthPageShell({
  children,
  variant,
}: {
  children: ReactNode;
  variant: "login" | "signup";
}) {
  /** Login/signup are public: English only (no language switcher). */
  const t = getGlobalTopBarCopy("en");
  const ctaHref = variant === "login" ? "/signup" : "/login";
  const ctaLabel = variant === "login" ? t.cta : t.login;

  return (
    <div className="pp-lp pp-auth-page">
      <div className="pp-lp-atmosphere" aria-hidden />

      <header className="pp-lp-nav-shell">
        <div className="pp-lp-nav-capsule is-scrolled">
          <Link href="/" className="pp-lp-nav-brand">
            <PayPulseLogo className="pp-lp-nav-mark" />
            <span className="pp-lp-nav-wordmark">PayPulss</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href={ctaHref} className="pp-lp-btn bg-primary px-4 py-1.5 text-white">
              {ctaLabel}
            </Link>
          </div>
        </div>
      </header>

      <main className="pp-auth-stage">{children}</main>
    </div>
  );
}
