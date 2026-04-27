import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";

export const metadata: Metadata = {
  title: "Mentions légales | PayPulse",
  description: "Mentions légales PayPulse : éditeur, hébergeur, contact.",
};

export default function MentionsLegalesPage() {
  return (
    <LegalLayout title="Mentions légales" updated="21 avril 2026">
      <p>
        Conformément aux usages en vigueur en France pour les sites professionnels, les informations ci-dessous
        identifient l&apos;éditeur du site et l&apos;hébergeur.{" "}
        <strong>Remplacez tous les champs […] avant mise en ligne.</strong>
      </p>

      <h2>1. Éditeur du site et du service</h2>
      <ul>
        <li>
          <strong>Dénomination sociale :</strong> [SOCIÉTÉ]
        </li>
        <li>
          <strong>Forme juridique :</strong> [FORME_JURIDIQUE]
        </li>
        <li>
          <strong>Capital social :</strong> [CAPITAL_SOCIAL] (si applicable)
        </li>
        <li>
          <strong>Siège social :</strong> [ADRESSE_SIÈGE]
        </li>
        <li>
          <strong>Immatriculation :</strong> [NUMÉRO_RCS] [RCS_VILLE] (si applicable)
        </li>
        <li>
          <strong>Numéro TVA intracommunautaire :</strong> [TVA_INTRACOMMUNAUTAIRE] (si applicable)
        </li>
        <li>
          <strong>Directeur de la publication :</strong> [NOM_PRÉNOM_DIRIGEANT]
        </li>
        <li>
          <strong>Contact :</strong> [EMAIL_CONTACT]
        </li>
      </ul>

      <h2>2. Hébergement</h2>
      <ul>
        <li>
          <strong>Hébergeur :</strong> [HÉBERGEUR]
        </li>
        <li>
          <strong>Adresse :</strong> [ADRESSE_HÉBERGEUR]
        </li>
        <li>
          <strong>Site web :</strong> [URL_HÉBERGEUR]
        </li>
      </ul>
      <p className="text-sm text-slate-600">
        Indication courante pour une application Next.js : hébergement auprès de Vercel Inc. ou équivalent — à confirmer
        selon votre contrat effectif.
      </p>

      <h2>3. Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments du site (textes, graphismes, logo, structure) est la propriété de l&apos;éditeur
        ou fait l&apos;objet d&apos;autorisations d&apos;utilisation. Toute reproduction non autorisée est interdite
        sous réserve des exceptions légales.
      </p>

      <h2>4. Médiation consommation (si applicable)</h2>
      <p>
        Si vous adressez des consommateurs soumis au code de la consommation français, vous devrez peut-être indiquer
        les coordonnées d&apos;un médiateur ou dispositif de règlement extrajudiciaire des litiges — à renseigner selon
        votre statut et votre offre : <strong>[MÉDIATION_CONSOMMATION]</strong>.
      </p>
    </LegalLayout>
  );
}
