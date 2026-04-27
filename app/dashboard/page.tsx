import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard | PayPulse",
  description: "Suivez vos clients, vos impayes et envoyez vos relances depuis PayPulse.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08080c] px-4 py-16 text-center text-sm text-slate-400">Chargement…</div>}>
      <DashboardView />
    </Suspense>
  );
}
