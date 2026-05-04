import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardRouteSkeleton } from "./dashboard-route-skeleton";
import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard | PayPulss",
  description: "Suivez vos clients, vos impayes et envoyez vos relances depuis PayPulss.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardRouteSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}
