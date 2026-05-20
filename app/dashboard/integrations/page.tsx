import type { Metadata } from "next";
import { Suspense } from "react";
import { IntegrationsView } from "./integrations-view";

export const metadata: Metadata = {
  title: "Intégrations | PayPulss",
  description: "Connectez Google Calendar pour afficher vos échéances et relances PayPulss dans votre agenda.",
};

export default function IntegrationsPage() {
  return (
    <Suspense fallback={null}>
      <IntegrationsView />
    </Suspense>
  );
}
