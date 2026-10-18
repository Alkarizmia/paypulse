import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { ConditionalTopBar } from "./conditional-topbar";
import { LocaleProvider } from "./locale-context";
import { DisplayCurrencyProvider } from "./display-currency-context";
import { ConditionalFooter } from "./conditional-footer";
import { AuthProvider } from "./auth-context";
import { PwaInstallProvider } from "./pwa-install-provider";
import { PwaRegister } from "./pwa-register";
import { GoogleAnalytics } from "./google-analytics";
import { LowPerformanceHtmlAttrs } from "@/lib/low-performance";
import { getSiteUrl } from "@/lib/site-url";
import { PageVisibilityHtmlAttrs } from "./page-visibility-html-attrs";

const font = Inter({
  subsets: ["latin"],
  variable: "--font-paypulse",
  display: "swap",
});

function metadataBaseUrl(): URL {
  return new URL(`${getSiteUrl()}/`);
}

export const metadata: Metadata = {
  title: "PayPulss · Relance facture impayée pour freelances",
  description:
    "Suivez vos impayés et relancez vos clients en deux clics. Pour freelances et petites agences.",
  metadataBase: metadataBaseUrl(),
  openGraph: {
    title: "PayPulss · Relance facture impayée pour freelances",
    description:
      "Suivez vos impayés et relancez vos clients en deux clics. Pour freelances et petites agences.",
    siteName: "PayPulss",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PayPulss · Relance facture impayée pour freelances",
    description:
      "Suivez vos impayés et relancez vos clients en deux clics. Pour freelances et petites agences.",
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
    <html lang="fr" className={font.variable} suppressHydrationWarning>
      <body className={`${font.className} min-h-screen antialiased`} suppressHydrationWarning>
        <LowPerformanceHtmlAttrs />
        <PageVisibilityHtmlAttrs />
        <PwaInstallProvider>
          <PwaRegister />
          <AuthProvider>
          <LocaleProvider>
            <DisplayCurrencyProvider>
            <div className="flex min-h-screen flex-col">
              <ConditionalTopBar />
              <div className="flex-1">{children}</div>
              <ConditionalFooter />
            </div>
            </DisplayCurrencyProvider>
          </LocaleProvider>
        </AuthProvider>
        </PwaInstallProvider>
        <Analytics />
        <GoogleAnalytics />
      </body>
    </html>
  );
}
