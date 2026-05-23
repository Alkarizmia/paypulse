import type { Metadata } from "next";
import { LandingPageDynamic } from "@/app/landing/landing-page-dynamic";

export const metadata: Metadata = {
  title: "PayPulss · Encaissez plus vite, relances incluses",
  description:
    "PayPulss : clients, factures, statuts payé / non payé, relances e-mail automatiques et tableau de bord (en attente, reçu, retard moyen). Offres Free, Starter, Pro, Agency.",
};

export default function Home() {
  return <LandingPageDynamic />;
}
