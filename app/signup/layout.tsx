import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Sign Up Free | PayPulss",
  description:
    "Create your PayPulss account free. Track unpaid invoices and send payment reminders. No credit card required.",
  alternates: { canonical: getSiteUrl() + "/signup" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Sign Up Free | PayPulss",
    description:
      "Create your PayPulss account free. Track unpaid invoices and send payment reminders.",
    url: getSiteUrl() + "/signup",
    locale: "en_US",
    type: "website",
  },
};

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children;
}
