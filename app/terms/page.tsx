import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";
import { LEGAL_ENTITY } from "@/lib/legal-entity";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Terms of Use | PayPulss",
  description: "PayPulss terms of use: service use, accounts, limits, and liability.",
  alternates: { canonical: getSiteUrl() + "/terms" },
};

export default function TermsPage() {
  const e = LEGAL_ENTITY;
  return (
    <LegalLayout title="Terms of Use" updated="May 9, 2026">
      <p>
        These terms govern access to and use of the online service{" "}
        <strong>{e.productBrand}</strong> (hereinafter the “Service”), published by{" "}
        <strong>{e.denomination}</strong>, {e.address} (BCE/KBO {e.kbo}), contact:{" "}
        <a href={`mailto:${e.contactEmail}?subject=Terms%20${e.productBrand}`} className="font-semibold text-blue-700 underline hover:text-blue-600">
          {e.contactEmail}
        </a>
        .
      </p>
      <p className="rounded-lg border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-800">
        <strong className="text-slate-900">Publisher identity</strong>
        <br />
        Founder: {e.founder}
        <br />
        Legal responsible person: {e.publicationDirector}
      </p>
      <p className="text-sm text-slate-600">
        Have these terms reviewed by a legal professional before large-scale commercialization or sector-specific
        clauses.
      </p>

      <h2>1. Purpose of the Service</h2>
      <p>
        PayPulss is software for freelancers and independents to <strong>organize</strong> client and invoice
        tracking, payment statuses, email reminders (according to features actually available in your version), and
        a summary dashboard (e.g. amounts pending, collected, delays). Technical integrations (e.g. outbound
        webhooks, data export) may be offered depending on product configuration.
      </p>
      <p>
        <strong>The Service does not constitute accounting, tax, or legal advice.</strong> You remain solely
        responsible for complying with your legal, reporting, and contractual obligations toward your clients and
        authorities.
      </p>

      <h2>2. Acceptance</h2>
      <p>
        Creating an account or using the Service constitutes acceptance of these terms. If you do not accept these
        terms, you must not use the Service.
      </p>

      <h2>3. User account</h2>
      <ul>
        <li>You must provide accurate information and keep your credentials confidential.</li>
        <li>
          Any activity carried out from your account is deemed performed by you or under your responsibility.
        </li>
        <li>
          We may suspend or close an account in case of serious breach of these terms or risk to the security of
          the Service, to the extent permitted by law.
        </li>
      </ul>

      <h2>4. Offers, pricing, and payment</h2>
      <p>
        Free and paid offers may be available. Billing, renewal, and cancellation terms for paid subscriptions will
        be specified when the payment provider is integrated (e.g. <strong>Stripe</strong>): where applicable, that
        provider’s commercial and data-processing terms also apply for the payment part.
      </p>

      <h2>5. Acceptable use</h2>
      <ul>
        <li>
          You agree to use the Service only for lawful purposes and not to send reminders or messages that are
          abusive, misleading, or contrary to rules applicable to commercial or professional communications.
        </li>
        <li>
          You must not attempt to access other users’ data, circumvent security measures, or use the Service to
          distribute malware or spam.
        </li>
        <li>
          Automatic reminders configured from your account are under your responsibility: content, frequency, and
          recipients.
        </li>
      </ul>

      <h2>6. Content and intellectual property</h2>
      <p>
        Data you enter belongs to you or falls under your contractual rights with your clients. We do not claim
        ownership of your business content. PayPulss code, interface, brand, and documentation remain the property
        of the publisher or its licensors.
      </p>

      <h2>7. Availability</h2>
      <p>
        We aim for reasonable availability of the Service. Interruptions (maintenance, updates, force majeure,
        provider failure) may occur; except where mandatory law provides otherwise, absolute availability is not
        guaranteed.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the extent permitted by applicable law, the publisher’s liability shall not be engaged for indirect or
        unforeseeable damages, nor for consequences of delays or non-payment by your own clients, nor for data entry
        or interpretation errors. The Service is provided “as is”; it is for the user to verify that the product
        fits their needs.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may stop using the Service at any time. We may terminate or suspend access in accordance with section 3.
        Data may be deleted or anonymized after account closure, according to the privacy policy and the law.
      </p>

      <h2>10. Governing law and disputes</h2>
      <p>
        Except where mandatory provisions provide otherwise, these terms are governed by{" "}
        <strong>Belgian law</strong>
        {". "}
        Jurisdiction: in case of a dispute relating to the interpretation or performance of these terms, and subject
        to mandatory rules applicable to consumers (including those of the European Union), the{" "}
        <strong>courts of the judicial district of Brussels</strong> have jurisdiction, noting that the publisher’s
        place of business ({e.denomination}) is established at {e.address}.
      </p>
    </LegalLayout>
  );
}
