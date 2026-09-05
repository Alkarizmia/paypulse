import type { Metadata } from "next";
import { LandingPageDynamic } from "@/app/landing/landing-page-dynamic";

export const metadata: Metadata = {
  title: "PayPulss · Your work deserves to be paid on time",
  description:
    "Track payments, automate follow-ups, and keep a clear view of your activity. No scattered spreadsheets.",
};

export default function Home() {
  return <LandingPageDynamic />;
}
