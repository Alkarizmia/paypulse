import type { Metadata } from "next";
import { LandingPage } from "./landing/landing-page";

export const metadata: Metadata = {
  title: "PayPulse — Encaissez plus vite, relances incluses",
  description:
    "PayPulse : clients, factures, statuts payé / non payé, relances e-mail automatiques et tableau de bord (en attente, reçu, retard moyen). Offres Free, Starter, Pro, Agency.",
};

export default function Home() {
  return <LandingPage />;
}
