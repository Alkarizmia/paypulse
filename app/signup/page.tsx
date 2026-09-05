"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLocale } from "@/app/locale-context";
import type { AppLocale } from "@/lib/app-locale";
import { pickQuad } from "@/lib/messages/pick";
import { AuthPageShell } from "@/app/auth/auth-page-shell";
import { GoogleAuthButton } from "@/app/auth/google-auth-button";
import { AuthOrDivider } from "@/app/auth/auth-or-divider";

type SignupErrorKey = "email_already_used";

function mapSignupErrorKey(rawMessage: string | null | undefined): SignupErrorKey | null {
  if (!rawMessage) return null;
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("user already registered")) {
    return "email_already_used";
  }

  return null;
}

function signupCopy(locale: AppLocale) {
  return pickQuad(locale, {
    fr: {
      title: "Inscription",
      subtitle: "Sans carte bancaire. Configuration rapide.",
      email: "Email",
      password: "Mot de passe",
      submit: "Creer le compte",
      google: "Continuer avec Google",
      or: "ou",
      alt: "Deja un compte ? Se connecter",
      missing: "Supabase n'est pas configure.",
      invalid: "Inscription impossible.",
      emailAlreadyUsed: "Cet email est deja utilise.",
      checkEmail:
        "Compte cree. Verifiez votre boite email pour confirmer votre adresse avant de vous connecter.",
      googleFailed: "Inscription Google impossible. Reessayez ou utilisez email et mot de passe.",
    },
    en: {
      title: "Create your account",
      subtitle: "No credit card. Set up in minutes.",
      email: "Email",
      password: "Password",
      submit: "Create account",
      google: "Continue with Google",
      or: "or",
      alt: "Already have an account? Login",
      missing: "Supabase is not configured.",
      invalid: "Signup failed.",
      emailAlreadyUsed: "This email is already in use.",
      checkEmail: "Account created. Check your inbox to confirm your email before logging in.",
      googleFailed: "Google sign-up failed. Try again or use email and password.",
    },
    nl: {
      title: "Registreren",
      subtitle: "Geen creditcard. Snel ingesteld.",
      email: "E-mail",
      password: "Wachtwoord",
      submit: "Account aanmaken",
      google: "Doorgaan met Google",
      or: "of",
      alt: "Al een account? Inloggen",
      missing: "Supabase is niet geconfigureerd.",
      invalid: "Registratie mislukt.",
      emailAlreadyUsed: "Dit e-mailadres is al in gebruik.",
      checkEmail: "Account aangemaakt. Bevestig je e-mail via je inbox voordat je inlogt.",
      googleFailed: "Google-registratie mislukt. Probeer opnieuw of gebruik e-mail en wachtwoord.",
    },
    es: {
      title: "Crea tu cuenta",
      subtitle: "Sin tarjeta. Configuracion rapida.",
      email: "Correo",
      password: "Contrasena",
      submit: "Crear cuenta",
      google: "Continuar con Google",
      or: "o",
      alt: "Ya tienes cuenta? Iniciar sesion",
      missing: "Supabase no esta configurado.",
      invalid: "No se pudo crear la cuenta.",
      emailAlreadyUsed: "Este correo ya esta en uso.",
      checkEmail: "Cuenta creada. Revisa tu correo para confirmar la direccion antes de entrar.",
      googleFailed: "No se pudo registrar con Google. Prueba de nuevo o usa correo y contrasena.",
    },
  });
}

export default function SignupPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const t = signupCopy(locale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    setInfo(null);
    if (!supabase) {
      setError(t.missing);
      return;
    }
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
      if (authError) {
        const mappedKey = mapSignupErrorKey(authError.message);
        if (mappedKey === "email_already_used") {
          setError(t.emailAlreadyUsed);
          return;
        }
        setError(authError.message ?? t.invalid);
        return;
      }
      if (!data.session) {
        setInfo(t.checkEmail);
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
    <AuthPageShell variant="signup">
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
            onError={(msg) => {
              setInfo(null);
              setError(msg);
            }}
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
          {info && <p className="text-sm text-emerald-700">{info}</p>}
          <button
            className="pp-lp-btn w-full bg-primary px-4 py-2.5 text-white hover:bg-bg-dark disabled:opacity-70"
            disabled={loading}
            type="submit"
          >
            {loading ? "..." : t.submit}
          </button>
        </form>
        <Link href="/login" className="mt-5 inline-block text-sm font-medium text-accent hover:text-primary">
          {t.alt}
        </Link>
      </section>
    </AuthPageShell>
  );
}
