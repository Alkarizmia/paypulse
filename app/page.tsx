import type { Metadata } from "next";
import { LandingPage } from "@/app/landing/landing-page";
import { getSiteUrl } from "@/lib/site-url";

const TITLE = "Invoice Reminder Software for Freelancers | PayPulss";
const DESCRIPTION =
  "Track unpaid invoices and send automatic payment reminders. PayPulss helps freelancers get paid on time. Free plan available.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: getSiteUrl() + "/",
  },
  openGraph: {
    title: TITLE,
    description:
      "Track unpaid invoices and send automatic payment reminders. PayPulss helps freelancers get paid on time.",
    url: getSiteUrl() + "/",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description:
      "Track unpaid invoices and send automatic payment reminders. PayPulss helps freelancers get paid on time.",
  },
};

/** Landing in SSR (Client Component hydrated): H1 and copy present in the initial HTML. */
export default function Home() {
  return <LandingPage />;
}
