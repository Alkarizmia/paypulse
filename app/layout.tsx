import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ConditionalTopBar } from "./conditional-topbar";
import { LocaleProvider } from "./locale-context";
import { ConditionalFooter } from "./conditional-footer";
import { AuthProvider } from "./auth-context";
import { SpeedInsights } from "@vercel/speed-insights/next";

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-paypulse",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PayPulse — Factures et relances pour freelances",
  description:
    "SaaS pour freelances : suivi des factures, relances automatiques, tableau de bord simple. PayPulse.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PayPulse — Factures et relances pour freelances",
    description:
      "SaaS pour freelances : suivi des factures, relances automatiques, tableau de bord simple. PayPulse.",
    url: "/",
    siteName: "PayPulse",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PayPulse — Factures et relances pour freelances",
    description:
      "SaaS pour freelances : suivi des factures, relances automatiques, tableau de bord simple. PayPulse.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={font.variable}>
      <body className={`${font.className} min-h-screen antialiased`}>
        <AuthProvider>
          <LocaleProvider>
            <div className="flex min-h-screen flex-col">
              <ConditionalTopBar />
              <div className="flex-1">{children}</div>
              <ConditionalFooter />
            </div>
          </LocaleProvider>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
