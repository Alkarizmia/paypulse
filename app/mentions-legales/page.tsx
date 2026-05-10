import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

export const metadata: Metadata = {
  title: "Mentions légales | PayPulss",
  description: "Mentions légales PayPulss : éditeur Alkarizmia (Belgique), hébergeur, contact.",
};

export default function MentionsLegalesPage() {
  const e = LEGAL_ENTITY;
  return (
    <LegalLayout title="Mentions légales" updated="9 mai 2026">
      <p>
        Les informations ci-dessous identifient l&apos;éditeur du site et du service <strong>{e.productBrand}</strong>{" "}
        (marque d&apos;<strong>{e.denomination}</strong>), ainsi que l&apos;hébergeur technique. Elles sont fournies
        conformément aux usages en vigueur pour les sites professionnels en Belgique et dans l&apos;Union européenne.
      </p>

      <h2>1. Éditeur du site et du service</h2>
      <ul>
        <li>
          <strong>Dénomination sociale :</strong> {e.denomination}
        </li>
        <li>
          <strong>Forme juridique :</strong> {e.legalForm}
        </li>
        <li>
          <strong>Capital social :</strong> {e.capitalSocial}
        </li>
        <li>
          <strong>Domiciliation professionnelle / siège d&apos;exploitation :</strong> {e.address}
        </li>
        <li>
          <strong>Immatriculation :</strong> numéro d&apos;entreprise BCE/KBO {e.kbo}
        </li>
        <li>
          <strong>Numéro TVA intracommunautaire :</strong> {e.tva}
        </li>
        <li>
          <strong>Directeur de la publication :</strong> {e.publicationDirector}
        </li>
        <li>
          <strong>Contact :</strong>{" "}
          <a href={`mailto:${e.contactEmail}?subject=Contact%20${e.productBrand}`} className="text-blue-700 underline hover:text-blue-600">
            {e.contactEmail}
          </a>
        </li>
        <li>
          <strong>Fondateur :</strong> {e.founder}
        </li>
        <li>
          <strong>Service commercialisé sous la marque :</strong> {e.productBrand}
        </li>
      </ul>

      <h2>2. Hébergement</h2>
      <ul>
        <li>
          <strong>Hébergeur :</strong> {e.host.name}
        </li>
        <li>
          <strong>Adresse :</strong> {e.host.address}
        </li>
        <li>
          <strong>Site web :</strong>{" "}
          <a href={e.host.url} className="text-blue-700 underline hover:text-blue-600" rel="noopener noreferrer">
            {e.host.url}
          </a>
        </li>
      </ul>
      <p className="text-sm text-slate-600">
        Les coordonnées d&apos;hébergement correspondent au prestataire habituellement utilisé pour une application
        Next.js déployée sur Vercel ; vérifiez qu&apos;elles correspondent bien à votre contrat effectif au moment de la
        mise en ligne.
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments du site (textes, graphismes, logo, structure) est la propriété de l&apos;éditeur ou
        fait l&apos;objet d&apos;autorisations d&apos;utilisation. Toute reproduction non autorisée est interdite sous
        réserve des exceptions légales.
      </p>

      <h2>4. Médiation et litiges (si applicable)</h2>
      <p>
        Selon votre statut, votre public (consommateurs ou professionnels) et le droit applicable (Belgique, Union
        européenne), vous pouvez être tenu d&apos;indiquer un dispositif de médiation ou les voies de réclamation
        compétentes. Complétez cette section avec les coordonnées officielles lorsque votre conseil ou votre autorité de
        contrôle vous y oblige.
      </p>
    </LegalLayout>
  );
}
