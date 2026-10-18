"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLocale } from "@/app/locale-context";
import { AuthPageShell } from "@/app/auth/auth-page-shell";

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

    let mounted = true;
    const next = searchParams.get("next")?.startsWith("/") ? searchParams.get("next")! : "/dashboard";

    const goNext = () => {
      if (!mounted) return;
      router.replace(next);
    };

    const hasSession = async () => {
      const { data } = await supabase.auth.getSession();
      return Boolean(data.session?.user);
    };

    void (async () => {
      // Cas fréquent : Supabase a déjà consommé le code / le hash avant ce rendu.
      // URL typique : /auth/callback?next=/dashboard# sans paramètre code.
      if (await hasSession()) {
        goNext();
        return;
      }

      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!mounted) return;
        if (!error) {
          goNext();
          return;
        }
        // Code déjà échangé ou course avec detectSessionInUrl : la session peut quand même exister.
        if (await hasSession()) {
          goNext();
          return;
        }
        setMessage(error.message || t.failed);
        return;
      }

      // Petit délai : la session hash/implicit peut arriver juste après le mount.
      await new Promise((r) => window.setTimeout(r, 250));
      if (!mounted) return;
      if (await hasSession()) {
        goNext();
        return;
      }

      setMessage(t.failed);
    })();

    return () => {
      mounted = false;
    };
  }, [router, searchParams, supabase, t.failed, t.missing]);

  return (
    <AuthPageShell variant="login">
      <section className="pp-auth-card text-center">
        <h1 className="text-xl font-semibold tracking-[-0.03em] text-text">{t.title}</h1>
        {message ? (
          <>
            <p className="mt-4 text-sm text-red-600">{message}</p>
            <Link href="/login" className="mt-6 inline-block text-sm font-medium text-accent hover:text-primary">
              {t.back}
            </Link>
          </>
        ) : (
          <p className="mt-4 text-sm text-text-muted">{t.loading}</p>
        )}
      </section>
    </AuthPageShell>
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
