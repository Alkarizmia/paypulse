import type { Metadata } from "next";
import { LandingPage } from "@/app/landing/landing-page";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "PayPulss · Relance facture impayée pour freelances",
  description:
    "Suivez vos impayés et relancez vos clients en deux clics. Tableau clair pour freelances et petites agences. Sans tableur dispersé.",
  alternates: {
    canonical: getSiteUrl() + "/",
  },
  openGraph: {
    title: "PayPulss · Relance facture impayée pour freelances",
    description:
      "Suivez vos impayés et relancez vos clients en deux clics. Pour freelances et petites agences.",
    url: getSiteUrl() + "/",
    locale: "fr_FR",
    type: "website",
  },
};

/** Landing en SSR (Client Component hydraté) : H1 et copy présents dans le HTML initial. */
export default function Home() {
  return <LandingPage />;
}
