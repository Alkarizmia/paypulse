import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";
import { LEGAL_ENTITY } from "@/lib/legal-entity";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Legal Notice | PayPulss",
  description: "PayPulss legal notice: publisher Alkarizmia (Belgium), host, contact.",
  alternates: { canonical: getSiteUrl() + "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  const e = LEGAL_ENTITY;
  return (
    <LegalLayout title="Legal Notice" updated="May 9, 2026">
      <p>
        The information below identifies the publisher of the site and service <strong>{e.productBrand}</strong>{" "}
        (a brand of <strong>{e.denomination}</strong>), as well as the technical host. It is provided in line with
        common practice for professional sites in Belgium and the European Union.
      </p>

      <h2>1. Publisher of the site and service</h2>
      <ul>
        <li>
          <strong>Legal name:</strong> {e.denomination}
        </li>
        <li>
          <strong>Legal form:</strong> {e.legalForm}
        </li>
        <li>
          <strong>Share capital:</strong> {e.capitalSocial}
        </li>
        <li>
          <strong>Professional address / place of business:</strong> {e.address}
        </li>
        <li>
          <strong>Registration:</strong> company number BCE/KBO {e.kbo}
        </li>
        <li>
          <strong>Intra-Community VAT number:</strong> {e.tva}
        </li>
        <li>
          <strong>Publication director:</strong> {e.publicationDirector}
        </li>
        <li>
          <strong>Contact:</strong>{" "}
          <a href={`mailto:${e.contactEmail}?subject=Contact%20${e.productBrand}`} className="text-blue-700 underline hover:text-blue-600">
            {e.contactEmail}
          </a>
        </li>
        <li>
          <strong>Founder:</strong> {e.founder}
        </li>
        <li>
          <strong>Service marketed under the brand:</strong> {e.productBrand}
        </li>
      </ul>

      <h2>2. Hosting</h2>
      <ul>
        <li>
          <strong>Host:</strong> {e.host.name}
        </li>
        <li>
          <strong>Address:</strong> {e.host.address}
        </li>
        <li>
          <strong>Website:</strong>{" "}
          <a href={e.host.url} className="text-blue-700 underline hover:text-blue-600" rel="noopener noreferrer">
            {e.host.url}
          </a>
        </li>
      </ul>
      <p className="text-sm text-slate-600">
        Hosting details correspond to the provider typically used for a Next.js application deployed on Vercel;
        verify they match your actual contract at the time of publication.
      </p>

      <h2>3. Intellectual property</h2>
      <p>
        All elements of the site (texts, graphics, logo, structure) are the property of the publisher or are used
        under license. Unauthorized reproduction is prohibited subject to legal exceptions.
      </p>

      <h2>4. Mediation and disputes (if applicable)</h2>
      <p>
        Depending on your status, your audience (consumers or professionals), and applicable law (Belgium,
        European Union), you may be required to indicate a mediation scheme or competent complaint channels. Complete
        this section with official contact details when your counsel or supervisory authority requires it.
      </p>
    </LegalLayout>
  );
}
