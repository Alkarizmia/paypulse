import Script from "next/script";

/** ID public GA4 (visible côté client). Surcharge possible via env. */
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-JJ2FRKBE3L";

/**
 * Balise Google Analytics (gtag.js), une seule fois dans le layout racine.
 * Note UE : pour un consentement cookies complet, ajouter un bandeau + Consent Mode.
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  );
}
