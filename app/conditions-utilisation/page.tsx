import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation | PayPulss",
  description: "CGU PayPulss : usage du service, comptes, limites, responsabilité.",
};

export default function ConditionsPage() {
  return (
    <LegalLayout title="Conditions générales d'utilisation (CGU)" updated="21 avril 2026">
      <p>
        Les présentes conditions régissent l&apos;accès et l&apos;utilisation du service en ligne <strong>PayPulss</strong>{" "}
        (ci-après le « Service »), édité par <strong>[SOCIÉTÉ]</strong>, [ADRESSE_SIÈGE] — contact :{" "}
        <strong>contact@paypulss.com</strong>.
      </p>
      <p className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
        <strong>Informations légales (temporaire)</strong>
        <br />
        Fondateur : El Fahmi Bilal
        <br />
        Responsable légale : Ikram El Fahmi
        <br />
        Email : contact@paypulss.com
        <br />
        Société : À compléter après immatriculation
      </p>
      <p className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
        Les champs […] sont des <strong>placeholders</strong> à compléter. Faites relire ces CGU par un professionnel du
        droit avant commercialisation.
      </p>

      <h2>1. Objet du Service</h2>
      <p>
        PayPulss est un outil logiciel destiné aux freelances et indépendants pour <strong>organiser</strong> le suivi
        des clients et des factures, les statuts de paiement, des relances par e-mail (selon les fonctionnalités
        effectivement disponibles dans votre version), et un tableau de bord synthétique (ex. montants en attente,
        encaissés, délais). Des intégrations techniques (ex. webhooks sortants, export de données) peuvent être proposées
        selon la configuration du produit.
      </p>
      <p>
        <strong>Le Service ne constitue pas un conseil comptable, fiscal ou juridique.</strong> Vous restez seul
        responsable du respect de vos obligations légales, déclaratives et contractuelles envers vos clients et les
        administrations.
      </p>

      <h2>2. Acceptation</h2>
      <p>
        La création d&apos;un compte ou l&apos;utilisation du Service vaut acceptation des présentes CGU. Si vous
        n&apos;acceptez pas ces conditions, vous ne devez pas utiliser le Service.
      </p>

      <h2>3. Compte utilisateur</h2>
      <ul>
        <li>Vous devez fournir des informations exactes et maintenir la confidentialité de vos identifiants.</li>
        <li>
          Toute activité réalisée depuis votre compte est réputée effectuée par vous ou sous votre responsabilité.
        </li>
        <li>
          Nous pouvons suspendre ou clôturer un compte en cas de manquement grave aux présentes CGU ou en cas de risque
          pour la sécurité du Service, dans la mesure permise par la loi.
        </li>
      </ul>

      <h2>4. Offres, tarifs et paiement</h2>
      <p>
        Des offres gratuites et payantes peuvent être proposées. Les modalités de facturation, de renouvellement et de
        résiliation des abonnements payants seront précisées au moment de l&apos;intégration du prestataire de paiement
        (ex. <strong>Stripe</strong>) : le cas échéant, les conditions commerciales et de traitement des données de ce
        prestataire s&apos;appliquent en parallèle pour la partie paiement.
      </p>

      <h2>5. Usage acceptable</h2>
      <ul>
        <li>
          Vous vous engagez à n&apos;utiliser le Service qu&apos;à des fins licites et à ne pas envoyer de relances ou
          de messages abusifs, trompeurs ou contraires aux règles applicables aux communications commerciales ou
          professionnelles.
        </li>
        <li>
          Vous ne devez pas tenter d&apos;accéder aux données d&apos;autres utilisateurs, de contourner les mesures de
          sécurité, ni d&apos;utiliser le Service pour distribuer des logiciels malveillants ou du spam.
        </li>
        <li>
          Les relances automatiques configurées depuis votre compte le sont sous votre responsabilité : contenu,
          fréquence et destinataires.
        </li>
      </ul>

      <h2>6. Contenu et propriété intellectuelle</h2>
      <p>
        Les données que vous saisissez vous appartiennent ou relèvent de vos droits contractuels avec vos clients. Nous
        ne revendiquons pas la propriété de vos contenus métier. Le code, l&apos;interface, la marque et la
        documentation PayPulss restent la propriété de l&apos;éditeur ou de ses concédants de licence.
      </p>

      <h2>7. Disponibilité</h2>
      <p>
        Nous visons une disponibilité raisonnable du Service. Des interruptions (maintenance, mise à jour, cas de force
        majeure, défaillance d&apos;un prestataire) peuvent survenir ; sauf disposition légale impérative contraire,
        aucune disponibilité absolue n&apos;est garantie.
      </p>

      <h2>8. Limitation de responsabilité</h2>
      <p>
        Dans les limites autorisées par la loi applicable, la responsabilité de l&apos;éditeur ne saurait être engagée
        pour les dommages indirects ou imprévisibles, ni pour les conséquences des retards ou défauts de paiement de vos
        propres clients, ni pour les erreurs de saisie ou d&apos;interprétation de vos données. Le Service est fourni «
        en l&apos;état » ; il appartient à l&apos;utilisateur de vérifier l&apos;adéquation du produit à ses besoins.
      </p>

      <h2>9. Résiliation</h2>
      <p>
        Vous pouvez cesser d&apos;utiliser le Service à tout moment. Nous pouvons résilier ou suspendre l&apos;accès
        conformément à la section 3. Les données peuvent être supprimées ou anonymisées après clôture du compte, selon
        la politique de confidentialité et la loi.
      </p>

      <h2>10. Droit applicable et litiges</h2>
      <p>
        Sauf disposition impérative contraire, les présentes CGU sont régies par le <strong>droit français</strong>.
        Attribution de compétence : <strong>[TRIBUNAL_COMPÉTENT]</strong> (à compléter, ex. tribunaux de [VILLE]), sous
        réserve des règles impératives applicables aux consommateurs.
      </p>
    </LegalLayout>
  );
}
