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
    <main className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.title}</h1>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block text-sm">
            <span className="text-slate-600">{t.email}</span>
            <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">{t.password}</span>
            <input className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-emerald-700">{info}</p>}
          <button className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700" disabled={loading} type="submit">
            {loading ? "..." : t.submit}
          </button>
        </form>
        <Link href="/login" className="mt-4 inline-block text-sm text-blue-700 hover:underline">
          {t.alt}
        </Link>
      </section>
    </main>
  );
}
