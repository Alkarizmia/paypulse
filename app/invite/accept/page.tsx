"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useLocale } from "@/app/locale-context";
import { acceptAccountInviteRpc } from "@/lib/team";
import { getSupabaseBrowserClient } from "@/lib/supabase";

function InviteAcceptInner() {
  const { locale } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token")?.trim() ?? "";
  const supabase = getSupabaseBrowserClient();
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function accept() {
    if (!supabase || !token) {
      setMessage(locale === "fr" ? "Lien invalide ou session requise." : "Invalid link or sign-in required.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setMessage(null);
    const res = await acceptAccountInviteRpc(supabase, token);
    if (res.ok) {
      setStatus("done");
      setMessage(locale === "fr" ? "Invitation acceptée. Redirection…" : "Invite accepted. Redirecting…");
      router.replace("/dashboard");
      return;
    }
    setStatus("error");
    setMessage(res.error ?? (locale === "fr" ? "Impossible d’accepter l’invitation." : "Could not accept invite."));
  }

  const t =
    locale === "fr"
      ? {
          title: "Invitation équipe",
          intro: "Connectez-vous avec le compte dont l’e-mail correspond à l’invitation, puis acceptez.",
          cta: "Accepter l’invitation",
          loading: "Traitement…",
          home: "Accueil",
          dash: "Tableau de bord",
        }
      : {
          title: "Team invite",
          intro: "Sign in with the email that received the invite, then accept.",
          cta: "Accept invite",
          loading: "Working…",
          home: "Home",
          dash: "Dashboard",
        };

  return (
    <main className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
      <p className="mt-2 text-sm text-slate-600">{t.intro}</p>
      {!token ? (
        <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {locale === "fr" ? "Paramètre token manquant dans l’URL." : "Missing token in URL."}
        </p>
      ) : (
        <button
          type="button"
          disabled={status === "loading" || status === "done"}
          onClick={() => void accept()}
          className="mt-6 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {status === "loading" ? t.loading : t.cta}
        </button>
      )}
      {message ? (
        <p
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            status === "error"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          {message}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/" className="text-violet-700 underline underline-offset-2 hover:text-violet-900">
          {t.home}
        </Link>
        <Link href="/dashboard" className="text-violet-700 underline underline-offset-2 hover:text-violet-900">
          {t.dash}
        </Link>
      </div>
    </main>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={<main className="mx-auto max-w-lg px-4 py-16 text-sm text-slate-600">Chargement…</main>}
    >
      <InviteAcceptInner />
    </Suspense>
  );
}
