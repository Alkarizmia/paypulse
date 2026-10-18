import Script from "next/script";

/** ID public GA4 (visible côté client). Surcharge possible via env. */
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-JJ2FRKBE3L";

/**
 * Google Analytics 4 avec Consent Mode v2.
 * Par défaut analytics_storage = denied ; le bandeau cookies met à jour le consentement.
 * Le script gtag se charge toujours (nécessaire au Consent Mode), sans cookies analytics tant que refusé.
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      <Script id="ga-consent-default" strategy="beforeInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
  wait_for_update: 500
});
try {
  var c = localStorage.getItem('paypulss_cookie_consent');
  if (c === 'accepted') {
    gtag('consent', 'update', { analytics_storage: 'granted' });
  } else if (c === 'refused') {
    gtag('consent', 'update', { analytics_storage: 'denied' });
  }
} catch (e) {}
        `}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
