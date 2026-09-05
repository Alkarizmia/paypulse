"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLocale } from "@/app/locale-context";
import type { AppLocale } from "@/lib/app-locale";
import { pickQuad } from "@/lib/messages/pick";
import { AuthPageShell } from "@/app/auth/auth-page-shell";
import { GoogleAuthButton } from "@/app/auth/google-auth-button";
import { AuthOrDivider } from "@/app/auth/auth-or-divider";

type LoginErrorKey = "invalid_credentials";

function mapLoginErrorKey(rawMessage: string | null | undefined): LoginErrorKey | null {
  if (!rawMessage) return null;
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "invalid_credentials";
  }

  return null;
}

function loginCopy(locale: AppLocale) {
  return pickQuad(locale, {
    fr: {
      title: "Connexion",
      subtitle: "Retrouvez vos factures et vos relances.",
      email: "Email",
      password: "Mot de passe",
      submit: "Se connecter",
      google: "Continuer avec Google",
      or: "ou",
      alt: "Pas de compte ? Creer un compte",
      missing: "Supabase n'est pas configure.",
      invalid: "Connexion impossible.",
      incorrectCreds: "Email ou mot de passe incorrect.",
      googleFailed: "Connexion Google impossible. Reessayez ou utilisez email et mot de passe.",
      oauthCallbackFailed: "La connexion Google a echoue. Reessayez.",
    },
    en: {
      title: "Log in",
      subtitle: "Pick up your invoices and reminders.",
      email: "Email",
      password: "Password",
      submit: "Login",
      google: "Continue with Google",
      or: "or",
      alt: "No account? Create one",
      missing: "Supabase is not configured.",
      invalid: "Login failed.",
      incorrectCreds: "Incorrect email or password.",
      googleFailed: "Google sign-in failed. Try again or use email and password.",
      oauthCallbackFailed: "Google sign-in failed. Please try again.",
    },
    nl: {
      title: "Inloggen",
      subtitle: "Ga verder met je facturen en herinneringen.",
      email: "E-mail",
      password: "Wachtwoord",
      submit: "Inloggen",
      google: "Doorgaan met Google",
      or: "of",
      alt: "Geen account? Account aanmaken",
      missing: "Supabase is niet geconfigureerd.",
      invalid: "Inloggen mislukt.",
      incorrectCreds: "Onjuist e-mailadres of wachtwoord.",
      googleFailed: "Google-aanmelding mislukt. Probeer opnieuw of gebruik e-mail en wachtwoord.",
      oauthCallbackFailed: "Google-aanmelding mislukt. Probeer opnieuw.",
    },
    es: {
      title: "Iniciar sesion",
      subtitle: "Retoma tus facturas y recordatorios.",
      email: "Correo",
      password: "Contrasena",
      submit: "Entrar",
      google: "Continuar con Google",
      or: "o",
      alt: "Sin cuenta? Crear una cuenta",
      missing: "Supabase no esta configurado.",
      invalid: "No se pudo iniciar sesion.",
      incorrectCreds: "Correo o contrasena incorrectos.",
      googleFailed: "No se pudo iniciar sesion con Google. Prueba de nuevo o usa correo y contrasena.",
      oauthCallbackFailed: "Fallo el inicio de sesion con Google. Intentalo de nuevo.",
    },
  });
}

function LoginPageInner() {
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getSupabaseBrowserClient();
  const t = loginCopy(locale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("error") === "oauth") {
      setError(t.oauthCallbackFailed);
    }
  }, [searchParams, t.oauthCallbackFailed]);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted && data.user) {
        router.replace("/dashboard");
      }
    });
    return () => {
      mounted = false;
    };
  }, [router, supabase]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!supabase) {
      setError(t.missing);
      return;
    }
    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) {
        const mappedKey = mapLoginErrorKey(authError.message);
        if (mappedKey === "invalid_credentials") {
          setError(t.incorrectCreds);
          return;
        }
        setError(authError.message ?? t.invalid);
        return;
      }
      router.replace("/dashboard");
    } catch {
      setError(t.invalid);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPageShell variant="login">
      <section className="pp-auth-card">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-text">{t.title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{t.subtitle}</p>

        <div className="mt-6">
          <GoogleAuthButton
            supabase={supabase}
            label={t.google}
            missingConfigMessage={t.missing}
            errorMessage={t.googleFailed}
            disabled={loading}
            onError={setError}
          />
        </div>

        <AuthOrDivider label={t.or} />

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-text-muted">{t.email}</span>
            <input
              className="pp-auth-field mt-1.5"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-text-muted">{t.password}</span>
            <div className="relative mt-1.5">
              <input
                className="pp-auth-field pr-11"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-text-muted transition hover:text-text"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.58A2 2 0 0013.42 13.42M9.88 4.24A10.45 10.45 0 0112 4c5.2 0 9.27 3.11 10.8 7.5a11.9 11.9 0 01-4.17 5.94M6.61 6.61A12.22 12.22 0 001.2 11.5 11.83 11.83 0 006.4 17.8" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            className="pp-lp-btn w-full bg-primary px-4 py-2.5 text-white hover:bg-bg-dark disabled:opacity-70"
            disabled={loading}
            type="submit"
          >
            {loading ? "..." : t.submit}
          </button>
        </form>
        <Link href="/signup" className="mt-5 inline-block text-sm font-medium text-accent hover:text-primary">
          {t.alt}
        </Link>
      </section>
    </AuthPageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
