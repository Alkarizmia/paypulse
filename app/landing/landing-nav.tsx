"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useAuth } from "@/app/auth-context";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How it works" },
  { href: "#faq", label: "FAQ" },
] as const;

export function LandingNav({
  onWaitlistClick,
}: {
  /** Kept for call-site compatibility; public header always uses waitlist CTA in production. */
  waitlistMode?: boolean;
  waitlistCtaLabel?: string;
  onWaitlistClick?: () => void;
} = {}) {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuId = useId();

  /** Production always shows waitlist. Dashboard CTA only in local/dev when logged in. */
  const showDashboardCta =
    process.env.NODE_ENV === "development" && isAuthenticated;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  function openWaitlist() {
    setMenuOpen(false);
    onWaitlistClick?.();
  }

  return (
    <header className={`pp-landing-header pp-enter-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="pp-landing-header__inner">
        <Link href="/" className="pp-landing-header__brand">
          <img
            src="/branding/paypulss-official-mark.png"
            alt=""
            width={40}
            height={36}
            className="pp-landing-header__mark"
          />
          <span className="pp-landing-header__wordmark">PayPulss</span>
        </Link>

        <nav className="pp-landing-header__nav" aria-label="Marketing">
          {NAV_LINKS.map((item) => (
            <a key={item.href} href={item.href} className="pp-landing-header__link">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="pp-landing-header__actions">
          {showDashboardCta ? (
            <Link href="/dashboard" className="pp-landing-header__cta">
              Go to dashboard
            </Link>
          ) : (
            <button type="button" onClick={openWaitlist} className="pp-landing-header__cta">
              Join the waitlist
            </button>
          )}

          <button
            type="button"
            className="pp-landing-header__menu-btn"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className="sr-only">{menuOpen ? "Close menu" : "Open menu"}</span>
            <span className="pp-landing-header__menu-icon" aria-hidden>
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <div id={menuId} className="pp-landing-header__drawer">
          <nav className="pp-landing-header__drawer-nav" aria-label="Marketing mobile">
            {NAV_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="pp-landing-header__drawer-link"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
