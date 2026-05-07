import type { Metadata } from "next";
import { LegalLayout } from "@/app/legal/legal-layout";

export const metadata: Metadata = {
  title: "Politique de confidentialité | PayPulss",
  description:
    "Politique de confidentialité PayPulss : données personnelles, finalités, sous-traitants, droits RGPD.",
};

export default function ConfidentialitePage() {
  return (
    <LegalLayout title="Politique de confidentialité" updated="21 avril 2026">
      <p>
        La présente politique décrit comment <strong>PayPulss</strong> (ci-après « nous », « le service ») traite les
        données personnelles dans le cadre du logiciel en ligne de suivi de factures et de relances pour freelances et
        indépendants.
      </p>
      <p>
        <strong>Responsable du traitement :</strong> [SOCIÉTÉ], [ADRESSE_SIÈGE]. Pour toute question relative aux
        données personnelles : <strong>contact@paypulss.com</strong>.
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
        Les mentions entre crochets […] sont des <strong>placeholders</strong> à remplacer par vos informations réelles
        avant mise en production. Un avis juridique est recommandé pour validation définitive.
      </p>

      <h2>1. Données collectées</h2>
      <p>Nous pouvons traiter notamment :</p>
      <ul>
        <li>
          <strong>Données de compte</strong> : adresse e-mail, mot de passe (haché par notre prestataire
          d&apos;authentification), identifiant technique, préférences de langue le cas échéant.
        </li>
        <li>
          <strong>Données que vous saisissez dans le service</strong> : noms ou dénominations de clients, montants
          et dates de factures, statuts (payé / non payé), paramètres de relances, adresses e-mail utilisées pour les
          relances, pièces jointes ou libellés que vous ajoutez volontairement.
        </li>
        <li>
          <strong>Données techniques</strong> : journaux limités (erreurs, sécurité), adresse IP, type de navigateur,
          selon la configuration de l&apos;hébergeur et des outils utilisés, dans la mesure où ils sont activés et
          proportionnés.
        </li>
      </ul>

      <h2>2. Finalités et bases légales (RGPD)</h2>
      <ul>
        <li>
          <strong>Fourniture et sécurisation du service</strong> (exécution du contrat / mesures précontractuelles ;
          intérêt légitime pour la sécurité) : authentification, stockage de vos données métier, isolation entre
          comptes, prévention des abus.
        </li>
        <li>
          <strong>Relances et notifications par e-mail</strong> (exécution du contrat ; lorsque vous configurez des
          relances à destination de vos propres clients, vous restez responsable du respect du droit applicable aux
          communications envoyées depuis votre compte).
        </li>
        <li>
          <strong>Facturation et gestion des abonnements</strong> (exécution du contrat) : lorsque la monétisation par
          abonnement sera activée via un prestataire de paiement (ex. Stripe), les données nécessaires au paiement
          seront traitées par ce prestataire selon sa propre politique.
        </li>
        <li>
          <strong>Obligations légales</strong> : conservation ou communication de données lorsque la loi l&apos;exige.
        </li>
        <li>
          <strong>Prospection ou newsletters</strong> : uniquement si vous mettez en place un mécanisme distinct avec
          consentement explicite ; à ce jour le service peut fonctionner sans prospection.
        </li>
      </ul>

      <h2>3. Sous-traitants et hébergement</h2>
      <p>
        Nous faisons appel à des prestataires techniques conformes aux usages du secteur. À titre indicatif (liste à
        actualiser selon votre déploiement réel) :
      </p>
      <ul>
        <li>
          <strong>Supabase</strong> : hébergement de la base de données, authentification, stockage associé au produit.
        </li>
        <li>
          <strong>Hébergeur du site et des API</strong> (ex. Vercel ou équivalent) : diffusion de l&apos;application
          web.
        </li>
        <li>
          <strong>Prestataire de paiement</strong> : lorsque Stripe (ou équivalent) sera intégré pour les abonnements,
          les données de paiement seront traitées par ce prestataire ; nous ne stockons pas vos numéros de carte
          complets sur nos propres serveurs applicatifs.
        </li>
        <li>
          <strong>Fournisseur d&apos;e-mail transactionnel</strong> : lorsque l&apos;envoi des relances sera branché
          (ex. Resend, SendGrid, etc.), les métadonnées nécessaires à l&apos;envoi transiteront par ce prestataire.
        </li>
        <li>
          <strong>Intégrations et exports</strong> : si vous utilisez des webhooks ou des exports vers vos propres
          systèmes ou prestataires, les flux concernés relèvent de votre configuration et des conditions de ces tiers.
        </li>
      </ul>

      <h2>4. Transferts hors Union européenne</h2>
      <p>
        Certains prestataires peuvent être établis ou héberger des données en dehors de l&apos;Espace économique
        européen. Le cas échéant, nous nous appuyons sur les mécanismes reconnus par la réglementation (clauses types de
        protection des données, mesures complémentaires si nécessaire), dans la mesure où nos prestataires les
        proposent. Le détail peut varier selon les sous-traitants effectivement retenus, tenez cette section à jour.
      </p>

      <h2>5. Durées de conservation</h2>
      <ul>
        <li>
          Données de compte et données métier : conservées tant que votre compte est actif, puis suppression ou
          anonymisation dans des délais raisonnables après clôture du compte, sauf obligation légale de conservation plus
          longue.
        </li>
        <li>Journaux techniques : durées courtes et proportionnées aux besoins de sécurité et de diagnostic.</li>
      </ul>

      <h2>6. Vos droits</h2>
      <p>
        Sous réserve des conditions prévues par le RGPD, vous disposez des droits d&apos;accès, de rectification,
        d&apos;effacement, de limitation du traitement, d&apos;opposition (notamment au traitement fondé sur
        l&apos;intérêt légitime lorsque le droit le permet), et de portabilité lorsque le traitement est fondé sur le
        consentement ou le contrat et automatisé.
      </p>
      <p>
        Vous pouvez exercer vos droits en écrivant à <strong>contact@paypulss.com</strong>. Réclamation auprès de la CNIL :{" "}
        <a href="https://www.cnil.fr" className="text-blue-700 underline hover:text-blue-800">
          www.cnil.fr
        </a>
        .
      </p>

      <h2>7. Cookies et traceurs</h2>
      <p>
        L&apos;application peut utiliser des cookies ou stockages locaux <strong>strictement nécessaires</strong> au
        fonctionnement (par exemple session, préférences de langue). Si vous ajoutez des outils d&apos;analyse ou de
        publicité non essentiels, vous devrez mettre en place un mécanisme de consentement conforme (bandeau,
        politique cookies dédiée) et mettre à jour la présente politique.
      </p>

      <h2>8. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles conformes aux pratiques courantes du secteur
        (authentification, contrôle d&apos;accès, chiffrement en transit via HTTPS, politiques d&apos;accès en base).
        Aucun système n&apos;est toutefois garanti exempt de risque ; signalement des vulnérabilités :{" "}
        <strong>contact@paypulss.com</strong>.
      </p>
    </LegalLayout>
  );
}
