import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardRouteSkeleton } from "./dashboard-route-skeleton";
import { DashboardView } from "./dashboard-view";

export const metadata: Metadata = {
  title: "Dashboard | PayPulss",
  description: "Private workspace: track clients, unpaid invoices, and send reminders.",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardRouteSkeleton />}>
      <DashboardView />
    </Suspense>
  );
}
