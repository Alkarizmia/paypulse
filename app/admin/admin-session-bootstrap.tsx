"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";

/**
 * Si le cookie httpOnly admin manque : tente la session navigateur,
 * appelle POST /api/admin/session (404 si non admin), puis refresh.
 * Sinon affiche une page 404 générique (ne révèle pas /admin).
 */
export function AdminSessionBootstrap() {
  const router = useRouter();
  const [show404, setShow404] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        if (!cancelled) setShow404(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        if (!cancelled) setShow404(true);
        return;
      }

      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (!cancelled) setShow404(true);
        return;
      }

      router.refresh();
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!show404) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-500">
        <span className="text-sm">…</span>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-slate-900">
      <h1 className="text-2xl font-semibold">404</h1>
      <p className="mt-2 text-sm text-slate-600">This page could not be found.</p>
    </main>
  );
}
