import Script from "next/script";
import { GA_MEASUREMENT_ID } from "@/lib/cookie-consent";

/**
 * Google Analytics 4 avec Consent Mode v2.
 * - consent default = denied (avant tout config)
 * - send_page_view désactivé au config : le page_view part après acceptation
 *   (voir applyAnalyticsConsent) ou au chargement si déjà accepté.
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
  wait_for_update: 2000
});
window.__pp_ga_consented = false;
try {
  var c = localStorage.getItem('paypulss_cookie_consent');
  if (c === 'accepted') {
    window.__pp_ga_consented = true;
    gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted'
    });
  } else if (c === 'refused') {
    gtag('consent', 'update', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
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
gtag('config', '${GA_MEASUREMENT_ID}', {
  anonymize_ip: true,
  send_page_view: !!window.__pp_ga_consented
});
        `}
      </Script>
    </>
  );
}
