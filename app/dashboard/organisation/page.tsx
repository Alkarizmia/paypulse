import type { Metadata } from "next";
import { OrganisationView } from "./organisation-view";

export const metadata: Metadata = {
  title: "Organisation | PayPulss",
  description: "Profil, calendrier des échéances, relances et encaissements.",
};

export default function OrganisationPage() {
  return <OrganisationView />;
}
