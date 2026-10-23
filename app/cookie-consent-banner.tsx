"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  type CookieConsentChoice,
  applyAnalyticsConsent,
  readCookieConsent,
  writeCookieConsent,
} from "@/lib/cookie-consent";
import { getCookieConsentCopy } from "@/lib/messages/cookie-consent-copy";

export function CookieConsentBanner() {
  /** Public surfaces stay English-only. */
  const t = getCookieConsentCopy("en");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = readCookieConsent();
    if (existing) {
      applyAnalyticsConsent(existing === "accepted");
      return;
    }
    setVisible(true);
  }, []);

  function choose(choice: CookieConsentChoice) {
    writeCookieConsent(choice);
    applyAnalyticsConsent(choice === "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t.title}
      className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-bg p-4 shadow-[0_-8px_30px_rgba(15,23,42,0.12)] sm:p-5"
    >
      <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text">{t.title}</p>
          <p className="mt-1 text-sm leading-relaxed text-text-muted">
            {t.body}{" "}
            <Link href="/privacy" className="font-medium text-accent underline underline-offset-2">
              {t.privacy}
            </Link>
            .
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => choose("refused")}
            className="rounded-lg border border-border bg-bg px-4 py-2 text-sm font-medium text-text-muted transition hover:bg-bg-alt hover:text-text"
          >
            {t.refuse}
          </button>
          <button
            type="button"
            onClick={() => choose("accepted")}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
