"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { useLocale } from "@/app/locale-context";

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
          <button className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700" disabled={loading} type="submit">
            {loading ? "..." : t.submit}
          </button>
        </form>
        <Link href="/signup" className="mt-4 inline-block text-sm text-blue-700 hover:underline">
          {t.alt}
        </Link>
      </section>
    </main>
  );
}
