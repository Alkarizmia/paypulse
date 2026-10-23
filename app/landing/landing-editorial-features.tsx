import { PaypulssPulseDivider } from "@/app/landing/paypulss-pulse";
import type { AppLocale } from "@/lib/app-locale";
import { getLandingPremiumCopy } from "@/lib/messages/landing-premium-copy";

/** 3 features max, résultats freelance, sans mock dashboard lourd. */
export function LandingEditorialFeatures({ locale: _locale }: { locale?: AppLocale }) {
  /** Public landing is English-only. */
  const c = getLandingPremiumCopy("en");

  const rows = [
    { title: c.feature1Title, body: c.feature1Body },
    { title: c.feature2Title, body: c.feature2Body },
    { title: c.feature3Title, body: c.feature3Body },
  ];

  return (
    <section id="features" className="scroll-mt-28 px-4 py-20 sm:px-6 sm:py-28">
      <PaypulssPulseDivider className="mx-auto mb-14" />
      <div className="mx-auto flex max-w-3xl flex-col gap-14 sm:gap-16">
        {rows.map((row) => (
          <article key={row.title}>
            <h2 className="max-w-md text-2xl font-semibold tracking-[-0.03em] text-text sm:text-3xl">
              {row.title}
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-text-muted">{row.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
