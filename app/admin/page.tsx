import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminSessionBootstrap } from "@/app/admin/admin-session-bootstrap";
import { AdminView } from "@/app/admin/admin-view";
import {
  ADMIN_ACCESS_COOKIE,
  getUserFromAccessToken,
  isAdminEmail,
} from "@/lib/admin-auth";
import {
  loadAdminDashboardData,
  parseAdminPeriod,
} from "@/lib/waitlist-admin-data";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ period?: string }>;
};

export default async function AdminPage({ searchParams }: PageProps) {
  const jar = await cookies();
  const token = jar.get(ADMIN_ACCESS_COOKIE)?.value?.trim() ?? "";

  if (!token) {
    return <AdminSessionBootstrap />;
  }

  const user = await getUserFromAccessToken(token);
  if (!user || !isAdminEmail(user.email)) {
    return <AdminSessionBootstrap />;
  }

  const params = searchParams ? await searchParams : {};
  const period = parseAdminPeriod(params.period);
  const data = await loadAdminDashboardData(period);

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-300">
        <p className="text-sm">Données indisponibles (Supabase / migration).</p>
      </main>
    );
  }

  return <AdminView data={data} />;
}
