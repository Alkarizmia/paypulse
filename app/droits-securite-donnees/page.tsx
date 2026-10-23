import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Data Security | PayPulss",
  description: "PayPulss security measures: authentication, data isolation, best practices.",
  alternates: { canonical: getSiteUrl() + "/droits-securite-donnees" },
};

export default function DataRightsPage() {
  return (
    <LegalLayout title="Data Security" updated="April 21, 2026">
      <p>
        This document presents, for information, the security principles applied to the <strong>PayPulss</strong>{" "}
        service. It complements the{" "}
        <a href="/privacy" className="text-blue-700 underline hover:text-blue-800">
          privacy policy
        </a>{" "}
        and the{" "}
        <a href="/terms" className="text-blue-700 underline hover:text-blue-800">
          terms of use
        </a>
        .
      </p>

      <h2>1. Authentication and access</h2>
      <ul>
        <li>
          Account access relies on an authentication mechanism managed by our technical provider (
          <strong>Supabase Auth</strong>): passwords stored in a secure form (hashing), sessions consistent with
          common practice.
        </li>
        <li>
          We do not ask you to transmit server secrets (“service” keys or equivalent) in the web interface: when
          such elements exist, they must remain confined to controlled server environments.
        </li>
      </ul>

      <h2>2. Data isolation (multi-user)</h2>
      <p>
        Records linked to your activity (clients, invoices, reminder settings, etc.) are stored in a database with{" "}
        <strong>Row Level Security (RLS)</strong> policies intended to limit read and write access to rows associated
        with your authenticated account. The effective configuration must be maintained and audited as the product
        evolves.
      </p>

      <h2>3. Transport and hosting</h2>
      <ul>
        <li>Exchanges with the application generally use HTTPS (encryption in transit).</li>
        <li>
          Data at rest is hosted with the selected providers (notably Supabase and the front-end host) according to
          their security commitments. We do not claim certifications we do not explicitly hold.
        </li>
      </ul>

      <h2>4. Backups and integrity</h2>
      <p>
        Backup and restore policy depends on options subscribed with providers and project configuration. Internally
        document backup frequency and restore procedures.
      </p>

      <h2>5. Vulnerability reporting</h2>
      <p>
        If you believe you have identified a security flaw, please contact us responsibly at{" "}
        <a href="mailto:contact@paypulss.com?subject=Security%20report%20PayPulss" className="font-semibold text-blue-700 underline hover:text-blue-600">
          contact@paypulss.com
        </a>{" "}
        (message subject: security report), avoiding public disclosure of exploitable details before a reasonable
        fix.
      </p>

      <h2>6. Roles and responsibilities</h2>
      <p>
        Service security is shared: the publisher implements reasonable measures on the infrastructure and
        application side; the user must protect credentials, use strong passwords, and follow good practices on their
        workstations.
      </p>
    </LegalLayout>
  );
}
