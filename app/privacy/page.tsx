import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";
import { LEGAL_ENTITY } from "@/lib/legal-entity";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Privacy Policy | PayPulss",
  description:
    "PayPulss privacy policy: personal data, purposes, processors, and GDPR rights.",
  alternates: { canonical: getSiteUrl() + "/privacy" },
};

export default function PrivacyPage() {
  const e = LEGAL_ENTITY;
  return (
    <LegalLayout title="Privacy Policy" updated="October 18, 2026">
      <p>
        This policy describes how <strong>{e.productBrand}</strong> (hereinafter “we”, “the service”),
        published by <strong>{e.denomination}</strong>, processes personal data in connection with the online
        software for invoice tracking and payment reminders for freelancers and independents.
      </p>
      <p>
        <strong>Data controller:</strong> {e.denomination}, {e.address} (BCE/KBO {e.kbo}). For any question
        about personal data:{" "}
        <a href={`mailto:${e.contactEmail}?subject=Personal%20data%20${e.productBrand}`} className="font-semibold text-blue-700 underline hover:text-blue-600">
          {e.contactEmail}
        </a>
        .
      </p>
      <p className="rounded-lg border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-800">
        <strong className="text-slate-900">Additional contact details</strong>
        <br />
        Founder: {e.founder}
        <br />
        Legal responsible person: {e.publicationDirector}
      </p>

      <p className="rounded-lg border border-indigo-200 bg-indigo-50/80 p-4 text-sm text-slate-800">
        <strong className="text-slate-900">Temporary provision: waitlist</strong>
        <br />
        While the product is not open to the public, access to the dashboard and sign-up may be closed in
        production. On the site, you can only leave your email address to be notified of the launch. This
        provision applies only during that period; it will be removed or updated when the service opens.
      </p>

      <p className="text-sm text-slate-600">
        A legal review remains recommended before any strong contractual commitment or large-scale sensitive
        processing.
      </p>

      <h2>1. Data collected</h2>
      <p>We may process in particular:</p>
      <ul>
        <li>
          <strong>Waitlist (current period)</strong>: email address, sign-up date, interface language, and
          attribution source (e.g. a <code>?src=</code> parameter from a video, or form placement). No password
          is requested for this sign-up. No email is sent automatically at the time of sign-up.
        </li>
        <li>
          <strong>Account data</strong>: email address, password (hashed by our authentication provider),
          technical identifier, language preferences where applicable, when product registration is open.
        </li>
        <li>
          <strong>Data you enter in the service</strong>: client names or business names, invoice amounts and
          dates, statuses (paid / unpaid), reminder settings, email addresses used for reminders, attachments or
          labels you add voluntarily.
        </li>
        <li>
          <strong>Technical data</strong>: limited logs (errors, security), IP address, browser type, depending
          on the host and tools configuration, to the extent they are enabled and proportionate.
        </li>
      </ul>

      <h2>2. Waitlist: purpose, retention, and rights</h2>
      <p>
        During the period before the public opening of {e.productBrand}, the email provided via the “waitlist”
        form is processed solely to:
      </p>
      <ul>
        <li>
          notify you when the service opens (one launch message, without a recurring commercial newsletter
          under this provision);
        </li>
        <li>
          store the registration in our database (Supabase), with useful technical metadata (language, source,
          date).
        </li>
      </ul>
      <p>
        <strong>Legal basis:</strong> your consent (voluntary form submission).{" "}
        <strong>Unsubscribe:</strong> you may request removal of your email at any time by writing to{" "}
        <a href={`mailto:${e.contactEmail}?subject=Unsubscribe%20waitlist`} className="text-blue-700 underline hover:text-blue-800">
          {e.contactEmail}
        </a>
        , or by replying to the launch email when it is sent.
      </p>
      <p>
        <strong>Retention:</strong> the email is kept until the launch announcement is sent (or until your
        erasure request), then deleted or anonymized within a reasonable time, unless you later create a user
        account.
      </p>
      <p>
        <strong>Sending the announcement:</strong> when the product opens, the publication email may be sent via
        our transactional email provider <strong>Resend</strong>, from addresses stored in Supabase. No automatic
        send is triggered at the time of waitlist sign-up.
      </p>

      <h2>3. Purposes and legal bases (GDPR)</h2>
      <ul>
        <li>
          <strong>Waitlist / launch notice</strong> (consent): see section 2, for as long as this provision is in
          force.
        </li>
        <li>
          <strong>Providing and securing the service</strong> (performance of the contract / pre-contractual
          measures; legitimate interest for security): authentication, storage of your business data, isolation
          between accounts, abuse prevention.
        </li>
        <li>
          <strong>Reminders and email notifications</strong> (performance of the contract; when you configure
          reminders to your own clients, you remain responsible for complying with applicable law for
          communications sent from your account).
        </li>
        <li>
          <strong>Billing and subscription management</strong> (performance of the contract): when subscription
          monetization is enabled via a payment provider (e.g. Stripe), data needed for payment will be processed
          by that provider under its own policy.
        </li>
        <li>
          <strong>Legal obligations</strong>: retention or disclosure of data where the law requires it.
        </li>
        <li>
          <strong>Prospecting or newsletters</strong>: only if you set up a separate mechanism with explicit
          consent; to date the service may operate without prospecting.
        </li>
      </ul>

      <h2>4. Processors and hosting</h2>
      <p>
        We use technical providers consistent with industry practice. For information (list to be updated
        according to your actual deployment):
      </p>
      <ul>
        <li>
          <strong>Supabase</strong>: database hosting (including the waitlist table), authentication, storage
          associated with the product.
        </li>
        <li>
          <strong>Site and API host</strong> (e.g. Vercel or equivalent): delivery of the web application.
        </li>
        <li>
          <strong>Payment provider</strong>: when Stripe (or equivalent) is integrated for subscriptions,
          payment data will be processed by that provider; we do not store your full card numbers on our own
          application servers.
        </li>
        <li>
          <strong>Transactional email provider (Resend)</strong>: sending the launch announcement to waitlist
          subscribers and, once the product is open, sending reminders configured in the service. Metadata needed
          for sending (recipient, message content) transit through this provider.
        </li>
        <li>
          <strong>Integrations and exports</strong>: if you use webhooks or exports to your own systems or
          providers, those flows fall under your configuration and those third parties’ terms.
        </li>
      </ul>

      <h2>5. Transfers outside the European Union</h2>
      <p>
        Some providers may be established or host data outside the European Economic Area. Where applicable, we
        rely on mechanisms recognized by the regulation (standard contractual clauses, supplementary measures if
        needed), to the extent our providers offer them. Details may vary by the processors actually used; keep
        this section up to date.
      </p>

      <h2>6. Retention periods</h2>
      <ul>
        <li>
          <strong>Waitlist</strong>: until the launch announcement or until your erasure request (see section 2).
        </li>
        <li>
          Account and business data: kept while your account is active, then deletion or anonymization within
          reasonable periods after account closure, unless a longer legal retention obligation applies.
        </li>
        <li>Technical logs: short periods proportionate to security and diagnostic needs.</li>
      </ul>

      <h2>7. Your rights</h2>
      <p>
        Subject to the conditions set out in the GDPR, you have rights of access, rectification, erasure,
        restriction of processing, objection (including to processing based on legitimate interest where the law
        allows), and portability where processing is based on consent or contract and is automated.
      </p>
      <p>
        You may exercise your rights by writing to <strong>{e.contactEmail}</strong>. Complaint to the Data
        Protection Authority (Belgium):{" "}
        <a href="https://www.autoriteprotectiondonnees.be" className="text-blue-700 underline hover:text-blue-800">
          www.autoriteprotectiondonnees.be
        </a>
        .
      </p>

      <h2>8. Cookies and trackers</h2>
      <p>
        The application uses cookies or local storage that are <strong>strictly necessary</strong> for operation
        (for example authentication session, language preferences, cookie consent choice). These are essential or
        purely technical; they do not require prior consent under applicable regulation.
      </p>
      <p>
        <strong>Audience measurement (optional):</strong> if you accept via the cookie banner, we enable{" "}
        <strong>Google Analytics 4</strong> (Google Ireland Ltd / Google LLC), measurement ID{" "}
        <code>G-JJ2FRKBE3L</code>. Purpose: site traffic statistics (page views, approximate provenance), to
        improve the service. Legal basis: your consent. You may refuse or change your choice by clearing the
        site’s local storage (key <code>paypulss_cookie_consent</code>) and reloading the page. No targeted
        advertising is enabled via this tool on {e.productBrand}.
      </p>
      <p>
        Until you refuse or have not chosen, Google analytics cookies are not set (Consent Mode: analytics storage
        denied by default). A refusal does not prevent browsing the site.
      </p>
      <p>
        For more information on Google Analytics:{" "}
        <a
          href="https://policies.google.com/privacy"
          className="text-blue-700 underline hover:text-blue-800"
          rel="noopener noreferrer"
          target="_blank"
        >
          policies.google.com/privacy
        </a>
        .
      </p>

      <h2>9. Security</h2>
      <p>
        We implement technical and organizational measures consistent with common industry practice
        (authentication, access control, encryption in transit via HTTPS, database access policies). No system is
        guaranteed free of risk; report vulnerabilities to: <strong>{e.contactEmail}</strong>.
      </p>
    </LegalLayout>
  );
}
