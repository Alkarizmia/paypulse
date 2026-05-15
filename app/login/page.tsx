"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLocale } from "@/app/locale-context";
import { AuthPremiumBackground } from "@/app/auth/auth-premium-background";

type LoginErrorKey = "invalid_credentials";

function mapLoginErrorKey(rawMessage: string | null | undefined): LoginErrorKey | null {
  if (!rawMessage) return null;
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "invalid_credentials";
  }

  return null;
}

export default function LoginPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t =
    locale === "fr"
      ? { title: "Connexion", email: "Email", password: "Mot de passe", submit: "Se connecter", alt: "Pas de compte ? Creer un compte", missing: "Supabase n'est pas configure.", invalid: "Connexion impossible.", incorrectCreds: "Email ou mot de passe incorrect." }
      : { title: "Login", email: "Email", password: "Password", submit: "Login", alt: "No account? Create one", missing: "Supabase is not configured.", invalid: "Login failed.", incorrectCreds: "Incorrect email or password." };

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
    <main className="relative flex min-h-[calc(100svh-3.75rem)] items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:px-6">
      <AuthPremiumBackground />
      <section className="relative z-[1] mx-auto w-full max-w-md rounded-2xl border border-slate-200/90 bg-white/85 p-6 shadow-[0_28px_70px_-28px_rgba(15,23,42,0.18),0_0_0_1px_rgba(255,255,255,0.9)_inset] backdrop-blur-xl ring-1 ring-slate-200/60">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.title}</h1>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">{t.email}</span>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">{t.password}</span>
            <div className="relative mt-1">
              <input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-11 text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/25"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-500 transition hover:text-slate-800"
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
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,0.55)] transition hover:bg-blue-700 disabled:opacity-70"
            disabled={loading}
            type="submit"
          >
            {loading ? "..." : t.submit}
          </button>
        </form>
        <Link href="/signup" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
          {t.alt}
        </Link>
      </section>
    </main>
  );
}
