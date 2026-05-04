import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConditionalTopBar } from "./conditional-topbar";
import { LocaleProvider } from "./locale-context";
import { ConditionalFooter } from "./conditional-footer";
import { AuthProvider } from "./auth-context";
import { PwaRegister } from "./pwa-register";

const font = Inter({
  subsets: ["latin"],
  variable: "--font-paypulse",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PayPulss — Factures et relances pour freelances",
  description:
    "SaaS pour freelances : suivi des factures, relances automatiques, tableau de bord simple. PayPulss.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PayPulss — Factures et relances pour freelances",
    description:
      "SaaS pour freelances : suivi des factures, relances automatiques, tableau de bord simple. PayPulss.",
    url: "/",
    siteName: "PayPulss",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PayPulss — Factures et relances pour freelances",
    description:
      "SaaS pour freelances : suivi des factures, relances automatiques, tableau de bord simple. PayPulss.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
  applicationName: "PayPulss",
  appleWebApp: {
    title: "PayPulss",
    capable: true,
    statusBarStyle: "black-translucent",
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
        <PwaRegister />
        <AuthProvider>
          <LocaleProvider>
            <div className="flex min-h-screen flex-col">
              <ConditionalTopBar />
              <div className="flex-1">{children}</div>
              <ConditionalFooter />
            </div>
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
