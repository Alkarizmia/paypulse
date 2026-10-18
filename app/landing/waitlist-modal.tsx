"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useLocale } from "@/app/locale-context";
import { getWaitlistCopy } from "@/lib/messages/waitlist-copy";
import { readWaitlistAttribution } from "@/lib/waitlist-attribution";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistModalProps = {
  open: boolean;
  onClose: () => void;
  source: string;
};

export function WaitlistModal({ open, onClose, source }: WaitlistModalProps) {
  const { locale } = useLocale();
  const t = getWaitlistCopy(locale);
  const titleId = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");
  const [errorKey, setErrorKey] = useState<"invalid" | "server" | "rate" | null>(null);

  useEffect(() => {
    if (!open) return;
    setStatus("idle");
    setErrorKey(null);
    setEmail("");
    setHoneypot("");
    const id = window.setTimeout(() => emailRef.current?.focus(), 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized)) {
      setStatus("error");
      setErrorKey("invalid");
      return;
    }
    setStatus("loading");
    setErrorKey(null);
    const attribution = readWaitlistAttribution(source);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalized,
          source: attribution,
          langue: locale,
          company: honeypot,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        already?: boolean;
        error?: string;
      };
      if (res.status === 429 || data.error === "rate_limited") {
        setStatus("error");
        setErrorKey("rate");
        return;
      }
      if (res.status === 400 || data.error === "invalid_email") {
        setStatus("error");
        setErrorKey("invalid");
        return;
      }
      if (!res.ok || !data.ok) {
        setStatus("error");
        setErrorKey("server");
        return;
      }
      setStatus(data.already ? "already" : "success");
    } catch {
      setStatus("error");
      setErrorKey("server");
    }
  }

  const errorMessage =
    errorKey === "invalid"
      ? t.errorInvalid
      : errorKey === "rate"
        ? t.errorRateLimit
        : errorKey === "server"
          ? t.errorServer
          : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label={t.close} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] w-full max-w-md rounded-2xl border border-border bg-bg p-6 sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-sm text-text-muted hover:text-text"
        >
          {t.close}
        </button>

        {status === "success" || status === "already" ? (
          <div className="py-6 text-center">
            <p className="text-lg font-semibold tracking-tight text-text">
              {status === "already" ? t.already : t.success}
            </p>
          </div>
        ) : (
          <>
            <h2 id={titleId} className="pr-10 text-xl font-semibold tracking-tight text-text">
              {t.modalTitle}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{t.modalSub}</p>

            <form className="relative mt-6 space-y-4" onSubmit={onSubmit} noValidate>
              <div>
                <label htmlFor="waitlist-email" className="block text-sm font-medium text-text">
                  {t.emailLabel}
                </label>
                <input
                  ref={emailRef}
                  id="waitlist-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.emailPlaceholder}
                  disabled={status === "loading"}
                  className="mt-1.5 w-full rounded-xl border border-border bg-bg-alt px-4 py-3.5 text-base text-text outline-none ring-accent focus:ring-2"
                />
                <div className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0" aria-hidden>
                  <label htmlFor="waitlist-company">Company</label>
                  <input
                    id="waitlist-company"
                    name="company"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>
                <p className="mt-2 text-xs text-text-muted">{t.hint}</p>
              </div>

              <p className="text-xs leading-relaxed text-text-muted">
                {t.consent}{" "}
                <Link href="/confidentialite" className="underline underline-offset-2 hover:text-text">
                  {t.privacyLink}
                </Link>
                . {t.unsubscribe}
              </p>

              {errorMessage ? (
                <p className="text-sm text-red-600" role="alert">
                  {errorMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={status === "loading"}
                className="pp-lp-btn w-full bg-primary px-5 py-3.5 text-base text-white disabled:opacity-60"
              >
                {status === "loading" ? t.submitting : t.submit}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
