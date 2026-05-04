"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLocale } from "@/app/locale-context";

type SignupErrorKey = "email_already_used";

function mapSignupErrorKey(rawMessage: string | null | undefined): SignupErrorKey | null {
  if (!rawMessage) return null;
  const normalized = rawMessage.toLowerCase();

  if (normalized.includes("user already registered")) {
    return "email_already_used";
  }

  return null;
}

export default function SignupPage() {
  const { locale } = useLocale();
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t =
    locale === "fr"
      ? {
          title: "Inscription",
          email: "Email",
          password: "Mot de passe",
          submit: "Creer le compte",
          alt: "Deja un compte ? Se connecter",
          missing: "Supabase n'est pas configure.",
          invalid: "Inscription impossible.",
          emailAlreadyUsed: "Cet email est deja utilise.",
          checkEmail:
            "Compte cree. Verifiez votre boite email pour confirmer votre adresse avant de vous connecter.",
        }
      : {
          title: "Signup",
          email: "Email",
          password: "Password",
          submit: "Create account",
          alt: "Already have an account? Login",
          missing: "Supabase is not configured.",
          invalid: "Signup failed.",
          emailAlreadyUsed: "This email is already in use.",
          checkEmail: "Account created. Check your inbox to confirm your email before logging in.",
        };

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
    <main className="relative flex min-h-[calc(100svh-3.75rem)] items-center justify-center overflow-hidden bg-[linear-gradient(180deg,#030712,#060d1f_45%,#040711)] px-4 py-8 sm:px-6">
      <div className="pp-landing-ambient" aria-hidden>
        <div
          className="pp-landing-ambient__blob left-[-18%] top-[-22%] h-[min(520px,62vw)] w-[min(520px,62vw)]"
          style={{ background: "radial-gradient(circle, rgba(61,255,138,0.24) 0%, rgba(61,255,138,0.08) 42%, transparent 72%)" }}
        />
        <div
          className="pp-landing-ambient__blob pp-landing-ambient__blob--2 right-[-16%] bottom-[-12%] h-[min(500px,58vw)] w-[min(500px,58vw)]"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.24) 0%, rgba(167,139,250,0.11) 46%, transparent 74%)" }}
        />
      </div>
      <section className="relative z-[1] mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1220]/80 p-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.75)] backdrop-blur-xl">
        <h1 className="text-2xl font-bold tracking-tight text-white">{t.title}</h1>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block text-sm">
            <span className="text-slate-300">{t.email}</span>
            <input
              className="mt-1 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-300">{t.password}</span>
            <div className="relative mt-1">
              <input
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 pr-11 text-white outline-none placeholder:text-slate-500 focus:border-blue-400/70 focus:ring-2 focus:ring-blue-500/30"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-slate-300 transition hover:text-white"
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
          {error && <p className="text-sm text-red-300">{error}</p>}
          {info && <p className="text-sm text-emerald-300">{info}</p>}
          <button className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_-14px_rgba(37,99,235,0.9)] transition hover:bg-blue-700 disabled:opacity-70" disabled={loading} type="submit">
            {loading ? "..." : t.submit}
          </button>
        </form>
        <Link href="/login" className="mt-4 inline-block text-sm text-blue-300 hover:text-blue-200 hover:underline">
          {t.alt}
        </Link>
      </section>
    </main>
  );
}
