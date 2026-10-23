import type { Metadata } from "next";
import { Suspense } from "react";
import { IntegrationsView } from "./integrations-view";

export const metadata: Metadata = {
  title: "Integrations | PayPulss",
  description: "Connect Google Calendar to see PayPulss due dates and reminders.",
};

export default function IntegrationsPage() {
  return (
    <Suspense fallback={null}>
      <IntegrationsView />
    </Suspense>
  );
}
