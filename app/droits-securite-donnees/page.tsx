import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";

export const metadata: Metadata = {
  title: "Sécurité des données | PayPulss",
  description: "Mesures de sécurité PayPulss : authentification, isolation des données, bonnes pratiques.",
};

export default function DataRightsPage() {
  return (
    <LegalLayout title="Sécurité des données" updated="21 avril 2026">
      <p>
        Ce document présente, à titre informatif, les principes de sécurité appliqués au service <strong>PayPulss</strong>.
        Il complète la{" "}
        <a href="/confidentialite" className="text-blue-700 underline hover:text-blue-800">
          politique de confidentialité
        </a>{" "}
        et les{" "}
        <a href="/conditions-utilisation" className="text-blue-700 underline hover:text-blue-800">
          conditions générales d&apos;utilisation
        </a>
        .
      </p>

      <h2>1. Authentification et accès</h2>
      <ul>
        <li>
          L&apos;accès au compte repose sur un mécanisme d&apos;authentification géré par notre prestataire technique (
          <strong>Supabase Auth</strong>) : mots de passe stockés sous forme sécurisée (hachage), sessions conformes aux
          pratiques courantes.
        </li>
        <li>
          Nous ne vous demandons pas de transmettre des secrets serveur (clés « service » ou équivalent) dans
          l&apos;interface web : ces éléments, lorsqu&apos;ils existent, doivent rester confinés à des environnements
          serveur contrôlés.
        </li>
      </ul>

      <h2>2. Isolation des données (multi-utilisateur)</h2>
      <p>
        Les enregistrements liés à votre activité (clients, factures, paramètres de relance, etc.) sont stockés dans une
        base de données avec des <strong>politiques Row Level Security (RLS)</strong> visant à limiter la lecture et
        l&apos;écriture aux seules lignes associées à votre compte authentifié. La configuration effective doit être
        maintenue et auditée lors des évolutions du produit.
      </p>

      <h2>3. Transport et hébergement</h2>
      <ul>
        <li>Les échanges avec l&apos;application s&apos;effectuent en général via HTTPS (chiffrement en transit).</li>
        <li>
          Les données au repos sont hébergées chez les prestataires retenus (notamment Supabase et l&apos;hébergeur du
          front) selon leurs engagements de sécurité. Nous n&apos;attribuons pas de certification que nous ne détenons
          pas explicitement.
        </li>
      </ul>

      <h2>4. Sauvegardes et intégrité</h2>
      <p>
        La politique de sauvegarde et de restauration dépend des options souscrites auprès des prestataires et de la
        configuration du projet. Il convient de documenter en interne la fréquence des sauvegardes et les procédures de
        restauration.
      </p>

      <h2>5. Signalement de vulnérabilités</h2>
      <p>
        Si vous pensez avoir identifié une faille de sécurité, merci de nous contacter de manière responsable à l&apos;adresse{" "}
        <strong>[EMAIL_SECURITY]</strong> (ex. <code className="rounded bg-slate-100 px-1 py-0.5 text-sm">security@exemple.com</code>
        ), en évitant de divulguer publiquement les détails exploitables avant correction raisonnable.
      </p>

      <h2>6. Rôles et responsabilités</h2>
      <p>
        La sécurité du service est partagée : l&apos;éditeur met en œuvre des mesures raisonnables côté infrastructure et
        application ; l&apos;utilisateur doit protéger ses identifiants, utiliser des mots de passe robustes et
        respecter les bonnes pratiques sur ses postes de travail.
      </p>
    </LegalLayout>
  );
}
