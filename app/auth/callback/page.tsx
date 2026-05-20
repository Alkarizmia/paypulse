"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLocale } from "@/app/locale-context";
import { AuthPremiumBackground } from "@/app/auth/auth-premium-background";

function AuthCallbackInner() {
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [message, setMessage] = useState<string | null>(null);

  const t =
    locale === "fr"
      ? {
          title: "Connexion Google",
          loading: "Finalisation de la connexion…",
          back: "Retour à la connexion",
          missing: "Supabase n'est pas configure.",
          failed: "Connexion Google impossible. Reessayez.",
        }
      : locale === "nl"
        ? {
            title: "Google-aanmelding",
            loading: "Aanmelding afronden…",
            back: "Terug naar inloggen",
            missing: "Supabase is niet geconfigureerd.",
            failed: "Google-aanmelding mislukt. Probeer opnieuw.",
          }
        : locale === "es"
          ? {
              title: "Inicio con Google",
              loading: "Finalizando el acceso…",
              back: "Volver al inicio de sesion",
              missing: "Supabase no esta configurado.",
              failed: "No se pudo iniciar sesion con Google. Intentalo de nuevo.",
            }
          : {
              title: "Google sign-in",
              loading: "Finishing sign-in…",
              back: "Back to login",
              missing: "Supabase is not configured.",
              failed: "Google sign-in failed. Please try again.",
            };

  useEffect(() => {
    if (!supabase) {
      setMessage(t.missing);
      return;
    }

    const oauthError = searchParams.get("error_description") ?? searchParams.get("error");
    if (oauthError) {
      setMessage(decodeURIComponent(oauthError.replace(/\+/g, " ")));
      return;
    }

    const code = searchParams.get("code");
    if (!code) {
      setMessage(t.failed);
      return;
    }

    let mounted = true;
    const next = searchParams.get("next")?.startsWith("/") ? searchParams.get("next")! : "/dashboard";

    void supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (!mounted) return;
      if (error) {
        setMessage(error.message || t.failed);
        return;
      }
      router.replace(next);
    });

    return () => {
      mounted = false;
    };
  }, [router, searchParams, supabase, t.failed, t.missing]);

  return (
    <main className="relative flex min-h-[calc(100svh-3.75rem)] items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6">
      <AuthPremiumBackground />
      <section className="relative z-[1] mx-auto w-full max-w-md rounded-2xl border border-slate-200/90 bg-white/85 p-6 text-center shadow-[0_28px_70px_-28px_rgba(15,23,42,0.18)] backdrop-blur-xl ring-1 ring-slate-200/60">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">{t.title}</h1>
        {message ? (
          <>
            <p className="mt-4 text-sm text-red-600">{message}</p>
            <Link href="/login" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">
              {t.back}
            </Link>
          </>
        ) : (
          <p className="mt-4 text-sm text-slate-600">{t.loading}</p>
        )}
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[calc(100svh-3.75rem)] items-center justify-center bg-slate-50 px-4">
          <p className="text-sm text-slate-600">…</p>
        </main>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
