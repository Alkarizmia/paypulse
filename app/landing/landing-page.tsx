"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePreferMinimalMotion } from "@/lib/use-prefer-minimal-motion";
import { useState, type ReactNode } from "react";
import { PayPulseLogo } from "@/app/dashboard/pay-pulse-logo";
import { MARKETING_PLANS, type PlanId } from "@/lib/plans";
import { useLocale } from "@/app/locale-context";
import { useAuth } from "@/app/auth-context";
import { PwaInstallButton } from "@/app/pwa-install-button";
import {
  HeroEntrance,
  Reveal,
} from "@/app/landing/landing-motion";
import { ScrollShiftSection } from "@/app/landing/scroll-shift-section";
import { PaypulssScrollPin } from "@/app/landing/paypulss-scroll-pin";
import { ProofStatsSection } from "@/app/landing/proof-stats-section";
import { LandingGreyWaveBackdrop } from "@/app/landing/landing-wave-backdrop";

import {
  DashboardChartsMock,
  type ChartsMockCopy,
  type DashboardMockTheme,
} from "@/app/landing/dashboard-charts-mock";
import { ProductTourMarquee } from "@/app/landing/product-tour-marquee";
import { FeaturesRevealGrid } from "@/app/landing/features-reveal-grid";

const ACCENT = "#34D399";
const BG = "#f8fafc";
const FOUNDER_NAME = "El Fahmi Bilal";
const FOUNDER_IMAGE_SRC = "/images/founder-bilal.png";

type BillingCycle = "monthly" | "annual";

type AnnualPricing = {
  annual: string;
  oldAnnual: string;
};

const ANNUAL_PRICING: Partial<Record<PlanId, AnnualPricing>> = {
  starter: { annual: "86.40€", oldAnnual: "108€" },
  pro: { annual: "182.40€", oldAnnual: "228€" },
  agency: { annual: "374.40€", oldAnnual: "468€" },
};

const PLAN_FR: Record<
  PlanId,
  { name: string; description: string; features: string[]; periodLabel: string; cta: string }
> = {
  free: {
    name: "Gratuit",
    description: "Pour tester : quelques clients, quelques factures, rappels simples.",
    features: ["3 clients maximum", "5 factures maximum", "Rappels e-mail basiques"],
    periodLabel: "gratuit",
    cta: "Tester gratuitement",
  },
  starter: {
    name: "Starter",
    description: "L’offre la plus choisie quand l’argent doit vraiment rentrer.",
    features: [
      "Clients illimités",
      "Tableau de bord : en attente, reçu, retard moyen",
      "Graphiques d’évolution et répartition (encaissements, payé / en attente)",
      "Relances automatiques + 1 modèle de relance personnalisable (sans lien de paiement)",
    ],
    periodLabel: "/mois",
    cta: "Choisir Starter",
  },
  pro: {
    name: "Pro",
    description: "Quand vous voulez des relances plus travaillées sans tout réécrire.",
    features: [
      "Relances automatiques",
      "Brouillons de relance assistés par IA (à venir)",
      "Statistiques de paiement avancées",
      "Modèles d’e-mails réutilisables",
    ],
    periodLabel: "/mois",
    cta: "Choisir Pro",
  },
  agency: {
    name: "Agence",
    description: "Plusieurs marques, plusieurs personnes, un suivi qui reste lisible.",
    features: [
      "Jusqu’à 2 portefeuilles (workspaces) pour isoler des marques ou activités",
      "Multi-clients / multi-marques",
      "Rôles pour l’équipe",
    ],
    periodLabel: "/mois",
    cta: "Parler à l’équipe",
  },
};

export function ProductDemoMock({
  demo,
  className,
}: {
  demo: {
    panelTitle: string;
    tabIn: string;
    tabOut: string;
    rowClient: string;
    rowAmount: string;
    rowStatus: string;
    dueLabel: string;
    toggleLabel: string;
    receiptTitle: string;
    receiptLine: string;
    receiptTotal: string;
    floatLabel: string;
  };
  className?: string;
}) {
  return (
    <div className={`relative mx-auto max-w-xl lg:mx-0 ${className ?? ""}`}>
      <div className="absolute -right-6 -top-4 z-10 hidden max-w-[200px] rounded-xl border border-white/10 bg-[#0a1f35] p-3 shadow-xl sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>
          {demo.floatLabel}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400">{demo.toggleLabel}</span>
          <button
            type="button"
            className="relative h-5 w-9 rounded-full bg-[#34D399]/30 transition"
            aria-label="Toggle"
          >
            <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-[#34D399] shadow" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-black/50">
        <div className="flex items-center justify-between border-b border-slate-200/80 bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-medium text-slate-500">{demo.panelTitle}</span>
          <span className="w-10" />
        </div>
        <div className="grid gap-0 sm:grid-cols-[1fr_140px]">
          <div className="border-b border-slate-100 p-4 sm:border-b-0 sm:border-r">
            <div className="flex gap-2 text-xs font-semibold">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-white">{demo.tabIn}</span>
              <span className="rounded-full px-3 py-1 text-slate-500">{demo.tabOut}</span>
            </div>
            <ul className="mt-4 space-y-2">
              <li className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm">
                <span className="font-medium text-slate-800">{demo.rowClient}</span>
                <span className="font-semibold text-slate-900">{demo.rowAmount}</span>
              </li>
              <li className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 px-3 py-2.5 text-xs text-slate-500">
                <span>{demo.rowStatus}</span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                  {demo.dueLabel}
                </span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-50/50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{demo.receiptTitle}</p>
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-start gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-500">
                  PDF
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800">{demo.receiptLine}</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{demo.receiptTotal}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Aperçu double thème (sombre + clair) du dashboard. Pile les deux mocks dans
 * un grid 1×1, l'inactif dépasse en coin haut-droit pour montrer qu'il existe.
 * Click ou touche Entrée pour basculer.
 */
function DualThemeDashboardPreview({
  charts,
  hint,
  ariaLabelDark,
  ariaLabelLight,
}: {
  charts: ChartsMockCopy;
  hint: string;
  ariaLabelDark: string;
  ariaLabelLight: string;
}) {
  const [active, setActive] = useState<DashboardMockTheme>("dark");
  const swap = () => setActive((a) => (a === "dark" ? "light" : "dark"));

  const baseLayer =
    "col-start-1 row-start-1 will-change-transform transition-[transform,opacity,filter] duration-[450ms] ease-[cubic-bezier(0.22,1,0.36,1)]";
  const front = "z-20 translate-x-0 translate-y-0 scale-100 opacity-100 [filter:drop-shadow(0_18px_38px_rgba(15,23,42,0.18))]";
  const back =
    "z-10 translate-x-3 -translate-y-3 sm:translate-x-5 sm:-translate-y-5 lg:translate-x-6 lg:-translate-y-6 scale-[0.965] opacity-85 [filter:drop-shadow(0_10px_24px_rgba(15,23,42,0.12))]";

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={swap}
        aria-label={active === "dark" ? ariaLabelLight : ariaLabelDark}
        className="group relative block w-full cursor-pointer rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-[#34D399]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        <div className="grid">
          <div className={`${baseLayer} ${active === "dark" ? front : back}`}>
            <DashboardChartsMock theme="dark" charts={charts} className="lg:max-w-none" />
          </div>
          <div className={`${baseLayer} ${active === "light" ? front : back}`}>
            <DashboardChartsMock theme="light" charts={charts} className="lg:max-w-none" />
          </div>
        </div>
      </button>
      <div className="mt-6 flex flex-col items-center gap-3 sm:mt-8">
        <div role="tablist" aria-label={hint} className="inline-flex items-stretch rounded-full border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            role="tab"
            aria-selected={active === "dark"}
            onClick={() => setActive("dark")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition sm:text-sm ${
              active === "dark" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
              {ariaLabelDark}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={active === "light"}
            onClick={() => setActive("light")}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition sm:text-sm ${
              active === "light" ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1.5M12 19.5V21M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06M16.5 12a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              {ariaLabelLight}
            </span>
          </button>
        </div>
        <p className="text-xs text-slate-500 sm:text-sm">{hint}</p>
      </div>
    </div>
  );
}

type FeatureItem = { title: string; body: string; icon: ReactNode };

function featureIcon(kind: "clients" | "status" | "remind" | "dash" | "auto" | "data") {
  const stroke = { strokeWidth: 1.75 as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const common = "h-6 w-6 shrink-0 text-[#34D399]";
  switch (kind) {
    case "clients":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path {...stroke} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.813-4.003M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
        </svg>
      );
    case "status":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path {...stroke} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "remind":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path {...stroke} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      );
    case "dash":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path {...stroke} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 013 16.875v-3.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125v-8.25zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      );
    case "auto":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path {...stroke} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75V13.5z" />
        </svg>
      );
    case "data":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path {...stroke} d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125S3.75 16.153 3.75 13.875" />
        </svg>
      );
    default:
      return null;
  }
}

export function LandingPage() {
  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const reduceMotion = usePreferMinimalMotion();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");

  const t =
    locale === "fr"
      ? {
          product: "Factures et relances pour freelances",
          title: "PayPulss, relances et trésorerie pour freelances",
          heroBadge: "Factures · relances · trésorerie",
          heroSubline:
            "Automatisez vos relances, gardez une image pro et gagnez du temps, sans tableur dispersé.",
          heroLine1: "La machine de relances",
          heroLine2: "que votre trésorerie attendait.",
          body: "",
          microNoCard: "Aucune carte requise",
          heroTrustIntro: "Transparence & confiance",
          heroTrustPills: [
            "Chiffrement HTTPS",
            "Supabase ou mode local",
            "PWA installable",
            "Relances calibrées sur l’échéance",
          ],
          socialProof: "Déjà utilisé par plus de 100 freelances",
          statsTitle: "Une solution qui change le quotidien",
          statsSub: "Synthèse des retours utilisateurs, ordres de grandeur indicatifs.",
          stat1Val: "−35 %",
          stat1Lab: "de relances oubliées",
          stat2Val: "+18 %",
          stat2Lab: "d’encaissement plus rapide",
          stat3Val: "4 h",
          stat3Lab: "gagnées en moyenne / sem.",
          ctaTrial: "Commencer gratuitement",
          ctaDashboard: "Aller au dashboard",
          ctaPricing: "Voir comment ça marche",
          demoAnchor: "demo",
          pricingAnchor: "pricing",
          featuresTitle: "Moins d’impayés. Plus de cash. Plus de temps pour vous.",
          featuresSub: "Ce que PayPulss sécurise pour vous, sans jargon ni tableur dispersé.",
          recurringTitle: "Même client, mois après mois, sans tout recréer",
          recurringBody:
            "Quand une facture est payée, une petite flèche demi-tour à côté du badge « Payé » crée une nouvelle ligne pour le mois suivant (nom « x2 », « x3 »…), impayée avec la nouvelle échéance, sans toucher à l’ancienne ligne qui reste « Payée » avec sa date. Le bilan et les graphiques gardent ainsi une ligne par période, lisible pour vous et pour le client.",
          recurringImgAlt:
            "Illustration : carte facture avec badge Payé ; la flèche demi-tour à côté est un aperçu interactif du produit.",
          recurringArrowAria: "Aperçu : flèche demi-tour pour la facture du mois suivant (animation au survol).",
          recurringStep1Label: "Étape 1",
          recurringStep1Badge: "Payée",
          recurringStep1Body: "La facture du mois en cours est réglée.",
          recurringStep2Label: "Étape 2",
          recurringStep2Badge: "Impayé retard",
          recurringStep2Body: "La nouvelle ligne est créée pour le mois suivant, avec relance active.",
          demoTitle: "Ce que fait le produit (MVP)",
          demoSub:
            "Un écran simple : clients, factures, statuts, relances, et des graphiques comme sur le dashboard (encaissements, répartition). L’IA pour rédiger les relances arrive plus tard.",
          demoBullets: [
            "Fiches client avec montant dû et date d’échéance",
            "Statuts payé / impayé visibles en un coup d’œil",
            "Relances : prévisualisation puis envoi via votre messagerie",
            "Graphiques d’évolution et jauge payé / en attente / retard",
          ],
          demoModeHint: "Cliquez pour basculer entre mode clair et mode sombre",
          demoModeDark: "Mode sombre",
          demoModeLight: "Mode clair",
          faqTitle: "Questions fréquentes",
          faqSub: "Réponses courtes, contactez-nous pour un cas particulier.",
          faqItems: [
            {
              q: "Où sont stockées mes données ?",
              a: "Sans Supabase configuré, les données restent dans votre navigateur (mode local). Avec Supabase, elles sont sur votre projet cloud, protégées par les règles d’accès que vous déployez.",
            },
            {
              q: "Puis-je essayer sans carte bancaire ?",
              a: "Oui. L’offre gratuite suffit pour tester les flux et les quotas affichés sur le dashboard.",
            },
            {
              q: "Les relances partent-elles toutes seules ?",
              a: "Le MVP ouvre une prévisualisation (objet + corps) pour que vous validiez l’envoi depuis votre messagerie. Les relances automatiques complètes dépendent du plan et des réglages.",
            },
            {
              q: "Pourquoi je ne vois pas les mêmes graphiques que sur la page d’accueil ?",
              a: "L’image sur le site est une démo (données fictives) pour montrer le dashboard « complet ». Dans l’app, le plan Gratuit affiche les totaux principaux mais pas le graphique d’évolution ni la jauge de répartition : ces graphiques sont débloqués à partir de Starter (voir les offres).",
            },
            {
              q: "C’est quoi la différence avec un tableur ?",
              a: "Moins de copier-coller : une liste de dossiers, des statuts cohérents et des relances contextualisées au lieu de filtrer des lignes à la main.",
            },
          ],
          personaTitle: "Lucas, designer freelance",
          personaQuote: "« J’envoyais les factures, puis j’oubliais qui devait payer. Relancer me stressait. »",
          beforeTitle: "Avant",
          beforeBody:
            "Pas de visibilité sur les impayés, relances au cas par cas, peur de passer pour insistant.",
          beforeRows: [
            { name: "Client A", amount: "? €", state: "21j de retard" },
            { name: "Client B", amount: "—", state: "Relance oubliée" },
            { name: "Client ?", amount: "???", state: "Statut inconnu" },
          ] as const,
          afterTitle: "Après",
          afterBody:
            "Une liste claire, des relances qui partent au bon moment, une idée nette de ce qui rentre.",
          afterRows: [
            { name: "Acme studio", amount: "1 240 €", state: "Relancée J+3", kind: "ok" },
            { name: "Lefèvre & Co", amount: "860 €", state: "Payée", kind: "paid" },
            { name: "Belair", amount: "2 100 €", state: "Planifiée J+7", kind: "scheduled" },
          ] as const,
          pricingTitle: "Offres",
          pricingSub: "Tarifs indicatifs. Commencez gratuit, passez sur Starter quand ça roule.",
          pricingBillingMonthly: "Mensuel",
          pricingBillingAnnual: "Annuel",
          pricingAnnualSavingsNote: "Économisez 20% avec la facturation annuelle",
          pricingAnnualSavingsBadge: "20 %",
          pricingAnnualOldLabel: "au lieu de",
          popular: "Populaire",
          footerProduct: "Produit",
          footerCompany: "Société",
          footerLegal: "Mentions",
          footerLinks: {
            features: "Fonctionnalités",
            preview: "Aperçu",
            pricing: "Tarifs",
            faq: "FAQ",
            about: "À propos",
            founder: "Fondateur",
            careers: "Carrières",
            contact: "Contact",
            contactEmail: "Écrire par e-mail",
            privacy: "Confidentialité",
            terms: "CGU",
            legalHub: "Informations légales",
            mentions: "Mentions légales",
            security: "Sécurité des données",
            footerProductTour: "Le produit en images",
            footerHowLink: "Comment ça marche",
          },
          visualShowcaseTitle: "Le produit en images",
          visualShowcaseSub:
            "Schémas minimalistes des grands usages. L’interface détaillée est dans l’app.",
          visualShowcaseScrollHint:
            "Défilement automatique. Survolez le bandeau pour mettre en pause et lire une carte.",
          visualMarqueeDueTitle: "Échéances visibles",
          visualMarqueeDueBody:
            "Dates et retards lisibles avant d’envoyer la moindre relance.",
          visualMarqueeSecurityTitle: "Données maîtrisées",
          visualMarqueeSecurityBody:
            "Mode local ou cloud : vous gardez la main sur où vit l’information.",
          visualMarqueeRhythmTitle: "Rythme posé",
          visualMarqueeRhythmBody:
            "Relances calées pour soigner votre image sans harceler.",
          visualClientsTitle: "Clients & factures",
          visualClientsBody: "Chaque dossier : montant, échéance, statut. Fini le tableur éclaté.",
          visualClientsAlt: "Aperçu interface PayPulss : liste des dossiers avec montants et statuts",
          visualRelancesTitle: "Relances structurées",
          visualRelancesBody: "Messages prêts à partir, rythme posé, image pro préservée.",
          visualRelancesAlt: "Aperçu interface PayPulss : prévisualisation d’un e-mail de relance",
          visualTreasuryTitle: "Tableau de bord cash",
          visualTreasuryBody: "Encours, encaissements, retards : votre santé financière d’un regard.",
          visualTreasuryAlt: "Aperçu interface PayPulss : cartes KPI et graphiques de trésorerie",
          howCtaSignup: "Créer un compte gratuit",
          howCtaDemo: "Voir l’aperçu interactif",
          howCtaContact: "Nous contacter",
          planCtaEnFallback: "S'inscrire",
          demo: {
            panelTitle: "PayPulss · Aperçu",
            tabIn: "Encaissements",
            tabOut: "À relancer",
            rowClient: "Studio Mirabelle",
            rowAmount: "1 890 €",
            rowStatus: "Échéance dépassée de 3 jours",
            dueLabel: "Retard",
            toggleLabel: "Relance auto",
            receiptTitle: "Pièce jointe",
            receiptLine: "Facture · mission logo",
            receiptTotal: "640 €",
            floatLabel: "Rappel J+7",
          },
          chartsMock: {
            windowTitle: "PayPulss · Dashboard",
            pending: "Montant en attente",
            pendingVal: "8 420 €",
            received: "Reçus ce mois",
            receivedVal: "3 180 €",
            receivedHint: "+12 % vs mois dernier",
            overdue: "Factures en retard",
            overdueVal: "2",
            evolution: "Évolution des encaissements",
            evolutionHint: "Somme des factures payées par mois (données d’exemple).",
            distribution: "Répartition des factures",
            paid: "Payées",
            pendingL: "En attente",
            overdueL: "En retard",
            totalLabel: "Total",
            monthLabels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"] as const,
          },
          founderKicker: "Une face derrière le produit",
          founderRole: "Fondateur, PayPulss",
          installLabels: {
            defaultLabel: "Telecharger PayPulss",
            mobileLabel: "Installer sur mobile",
            macLabel: "Telecharger sur Mac",
            windowsLabel: "Telecharger sur Windows",
            secondaryLabel: "Installer l'application",
          },
          problemTitle: "Le probleme n'est pas vos clients. C'est le timing.",
          problemBody:
            "Les paiements en retard cassent la tresorerie, prennent du temps et ajoutent une charge mentale. PayPulss automatise le suivi sans casser votre relation client.",
          solutionTitle: "Une machine de relance elegante, connectee a votre rythme.",
          solutionBody:
            "Chaque facture est suivie, chaque relance est cadree, chaque encaissement est visible dans un dashboard clair et premium.",
          howTitle: "Comment ça marche",
          howKicker: "Parcours type",
          howSubtitle:
            "Une séquence simple : votre action, puis ce que PayPulss fait pour vous derrière les écrans, à chaque fois on précise qui intervient.",
          howConcernLabel: "Concerné",
          howFlowSteps: [
            {
              headline: "Centraliser vos clients et vos factures",
              whoLabel: "Vous",
              whoHint: "Freelance, auto-entrepreneur, petite structure ou équipe minimale qui facture et doit suivre les paiements.",
              body: "Ajoutez vos dossiers et échéances en quelques minutes : tout est lisible dans PayPulss plutôt qu’épars dans plusieurs fichiers.",
            },
            {
              headline: "Surveillance des dates et préparation des relances",
              whoLabel: "PayPulss",
              whoHint: "Le produit automatise la veille et la préparation des messages, ce n’est pas un interlocuteur humain tiers.",
              body: "L’outil repère les retards qui comptent pour vous et prépare des relances (objet, contenu, rythme) selon vos réglages et votre offre.",
            },
            {
              headline: "Encaissement plus fluide avec un suivi clair",
              whoLabel: "Vous & vos clients",
              whoHint: "La relation commerciale reste la vôtre ; vos clients sont simplement mieux guidés jusqu’au paiement.",
              body: "Vous gardez le contrôle (validation, tonalité). Le client voit des relances cohérentes et vous voyez tout de suite qui a payé et qui traîne.",
            },
          ],
          aboutTitle: "Apprenez à nous connaître !",
          aboutBody:
            "Je suis El Fahmi Bilal, fondateur de PayPulss. Le produit vient d’un constat simple : trop d’indépendants perdent du temps, et de la trésorerie, sur le suivi des factures et des relances. PayPulss existe pour vous redonner de la clarté : une liste lisible, des statuts fiables, des relances alignées avec votre image, sans charge mentale inutile. Mes valeurs : transparence (données sous contrôle), exécution soignée, et un outil qui reste simple mois après mois.",
          aboutExpertiseTitle: "Expertise :",
          aboutBullets: [
            "Conception produit & UX, factures, relances, tableau de bord",
            "Ingénierie web moderne (Next.js) et intégrations (Supabase, e-mail)",
            "Automatisation des suivis d’échéance et parcours d’envoi de relances",
            "Qualité & itérations rapides, sans sacrifier la lisibilité pour l’utilisateur",
            "Vision long terme : un SaaS utile au quotidien, pas un gadget",
          ],
          finalCtaTitle: "Arretez de courir apres votre argent",
          finalCtaButton: "Commencer gratuitement",
          features: [
            { kind: "clients" as const, title: "Clients & factures", body: "Centralisez dossiers, montants et dates d’échéance sans tableur dispersé." },
            { kind: "status" as const, title: "Payé / impayé", body: "Chaque ligne affiche un statut clair pour prioriser qui relancer." },
            { kind: "remind" as const, title: "Relances e-mail", body: "Brouillons prêts à l’emploi, envoi manuel (MVP) ; relances automatiques côté produit dès l’offre Pro." },
            { kind: "dash" as const, title: "Tableau de bord", body: "Encours, encaissé ce mois-ci, retard moyen : la santé cash d’un coup d’œil." },
            { kind: "auto" as const, title: "Automatisation", body: "Relances côté produit selon l’échéance ; en Agence, un second portefeuille (workspace) pour une autre marque ou filiale." },
            { kind: "data" as const, title: "Données sous contrôle", body: "Mode local ou Supabase : vous choisissez où vit la base, selon votre setup." },
          ],
        }
      : {
          product: "Invoices and nudges for freelancers",
          title: "PayPulss, payment nudges and cashflow for freelancers",
          heroBadge: "Invoices · nudges · cashflow",
          heroSubline:
            "Automate your follow-ups, stay on-brand and reclaim your time, without spreadsheet chaos.",
          heroLine1: "The reminder engine",
          heroLine2: "your cashflow deserves.",
          body: "",
          microNoCard: "No credit card required",
          heroTrustIntro: "Trust & clarity",
          heroTrustPills: [
            "HTTPS encryption",
            "Supabase or local mode",
            "Installable PWA",
            "Nudges aligned with due dates",
          ],
          socialProof: "Trusted by 100+ freelancers already",
          statsTitle: "Outcomes you can feel",
          statsSub: "Based on user feedback, illustrative ranges.",
          stat1Val: "−35%",
          stat1Lab: "fewer forgotten follow-ups",
          stat2Val: "+18%",
          stat2Lab: "faster cash-in (typical)",
          stat3Val: "4h",
          stat3Lab: "saved per week on average",
          ctaTrial: "Start free",
          ctaDashboard: "Go to dashboard",
          ctaPricing: "See how it works",
          demoAnchor: "demo",
          pricingAnchor: "pricing",
          featuresTitle: "Fewer late invoices. More cash. More time for you.",
          featuresSub: "What PayPulss quietly handles, without spreadsheet chaos.",
          recurringTitle: "Same client, month after month, without re-creating rows",
          recurringBody:
            "Once an invoice is paid, a small U-turn next to the Paid badge creates a new row for the next period (name suffix x2, x3…), unpaid with the new due date, while the previous row stays Paid with its paid-on date. Charts and the Summary report keep one line per period, clear for you and your client.",
          recurringImgAlt:
            "Illustration: invoice card with Paid badge; the U-turn control beside it is an interactive product preview.",
          recurringArrowAria: "Preview: U-turn for the next billing cycle (hover to animate).",
          recurringStep1Label: "Step 1",
          recurringStep1Badge: "Paid",
          recurringStep1Body: "The current month’s invoice is settled.",
          recurringStep2Label: "Step 2",
          recurringStep2Badge: "Unpaid overdue",
          recurringStep2Body: "A new row is created for the next month, with follow-up active.",
          demoTitle: "What the MVP covers",
          demoSub:
            "One calm screen: clients, invoices, statuses, nudges, and dashboard-style charts (cash-in trend, paid vs pending breakdown). AI-written reminders come later.",
          demoBullets: [
            "Client rows with amount due and due date",
            "Paid vs unpaid status visible at a glance",
            "Reminders: preview then send from your mail client",
            "Evolution chart and paid / pending / overdue donut",
          ],
          demoModeHint: "Click to toggle between light and dark mode",
          demoModeDark: "Dark mode",
          demoModeLight: "Light mode",
          faqTitle: "Frequently asked questions",
          faqSub: "Short answers, reach out for edge cases.",
          faqItems: [
            {
              q: "Where is my data stored?",
              a: "Without Supabase configured, data stays in your browser (local mode). With Supabase, it lives in your cloud project, protected by the access rules you deploy.",
            },
            {
              q: "Can I try without a credit card?",
              a: "Yes. The free tier is enough to test flows and the limits shown on the dashboard.",
            },
            {
              q: "Do reminders send automatically?",
              a: "The MVP opens a preview (subject + body) so you confirm send from your mail app. Full auto reminders depend on plan and settings.",
            },
            {
              q: "Why don’t I see the same charts as on your homepage?",
              a: "The screenshot on the site is a demo (sample numbers) of the “full” dashboard. In the app, the Free plan shows the key totals but not the evolution chart or the paid/pending donut, those unlock from Starter upward (see plans).",
            },
            {
              q: "How is this better than a spreadsheet?",
              a: "Less copy/paste: a case list, consistent statuses, and contextual nudges instead of filtering rows by hand.",
            },
          ],
          personaTitle: "Lucas, freelance designer",
          personaQuote: "“I sent invoices, then forgot who still owed me. Following up felt awkward.”",
          beforeTitle: "Before",
          beforeBody: "No clear view of overdue work, one-off emails, worried about sounding pushy.",
          beforeRows: [
            { name: "Client A", amount: "? €", state: "21d overdue" },
            { name: "Client B", amount: "—", state: "Reminder missed" },
            { name: "Client ?", amount: "???", state: "Status unknown" },
          ] as const,
          afterTitle: "After",
          afterBody: "A short list, reminders that fire on time, a clearer sense of what hits your account.",
          afterRows: [
            { name: "Acme studio", amount: "€1,240", state: "Reminded D+3", kind: "ok" },
            { name: "Lefèvre & Co", amount: "€860", state: "Paid", kind: "paid" },
            { name: "Belair", amount: "€2,100", state: "Scheduled D+7", kind: "scheduled" },
          ] as const,
          pricingTitle: "Plans",
          pricingSub: "Indicative pricing. Start free; move to Starter when volume picks up.",
          pricingBillingMonthly: "Monthly",
          pricingBillingAnnual: "Yearly",
          pricingAnnualSavingsNote: "Save 20% with yearly billing",
          pricingAnnualSavingsBadge: "20%",
          pricingAnnualOldLabel: "instead of",
          popular: "Popular",
          footerProduct: "Product",
          footerCompany: "Company",
          footerLegal: "Legal",
          footerLinks: {
            features: "Features",
            preview: "Preview",
            pricing: "Pricing",
            faq: "FAQ",
            about: "About",
            founder: "Founder",
            careers: "Careers",
            contact: "Contact",
            contactEmail: "Email us",
            privacy: "Privacy",
            terms: "Terms",
            legalHub: "Legal overview",
            mentions: "Legal notice",
            security: "Data security",
            footerProductTour: "Product visuals",
            footerHowLink: "How it works",
          },
          visualShowcaseTitle: "See the product visually",
          visualShowcaseSub: "Minimal schematics of core flows. The full UI lives in the app.",
          visualShowcaseScrollHint:
            "Auto-scrolling row. Hover the band to pause and read a card.",
          visualMarqueeDueTitle: "Due dates in view",
          visualMarqueeDueBody: "Deadlines and delays read clearly before any nudge goes out.",
          visualMarqueeSecurityTitle: "Data under your control",
          visualMarqueeSecurityBody: "Local or cloud: you choose where information lives.",
          visualMarqueeRhythmTitle: "Steady cadence",
          visualMarqueeRhythmBody: "Follow-ups paced to stay professional without nagging.",
          visualClientsTitle: "Clients & invoices",
          visualClientsBody: "Every case: amount, due date, status. No scattered spreadsheet.",
          visualClientsAlt: "PayPulss UI preview: case list with amounts and status chips",
          visualRelancesTitle: "Structured nudges",
          visualRelancesBody: "Ready-to-send emails, steady timing, professional tone.",
          visualRelancesAlt: "PayPulss UI preview: reminder email draft",
          visualTreasuryTitle: "Cashflow dashboard",
          visualTreasuryBody: "Outstanding, cash-in, overdue: your financial health at a glance.",
          visualTreasuryAlt: "PayPulss UI preview: KPI cards and treasury charts",
          howCtaSignup: "Start free",
          howCtaDemo: "See the interactive preview",
          howCtaContact: "Contact us",
          planCtaEnFallback: "Get started",
          demo: {
            panelTitle: "PayPulss · Preview",
            tabIn: "Paid / incoming",
            tabOut: "Needs nudge",
            rowClient: "Mirabelle Studio",
            rowAmount: "$1,890",
            rowStatus: "3 days past due",
            dueLabel: "Overdue",
            toggleLabel: "Auto nudge",
            receiptTitle: "Attachment",
            receiptLine: "Invoice · logo sprint",
            receiptTotal: "$640",
            floatLabel: "Day-7 nudge",
          },
          chartsMock: {
            windowTitle: "PayPulss · Dashboard",
            pending: "Amount pending",
            pendingVal: "$8,420",
            received: "Received this month",
            receivedVal: "$3,180",
            receivedHint: "+12% vs last month",
            overdue: "Overdue invoices",
            overdueVal: "2",
            evolution: "Cash-in evolution",
            evolutionHint: "Sum of paid invoices by month (sample data).",
            distribution: "Invoice breakdown",
            paid: "Paid",
            pendingL: "Pending",
            overdueL: "Overdue",
            totalLabel: "Total",
            monthLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"] as const,
          },
          founderKicker: "A face behind the product",
          founderRole: "Founder, PayPulss",
          installLabels: {
            defaultLabel: "Download PayPulss",
            mobileLabel: "Install on mobile",
            macLabel: "Download for Mac",
            windowsLabel: "Download for Windows",
            secondaryLabel: "Install the app",
          },
          problemTitle: "The problem is not your clients. It's timing.",
          problemBody:
            "Late payments hurt cash flow, waste time, and create friction. PayPulss automates follow-up without hurting client relationships.",
          solutionTitle: "A polished reminder engine built for speed.",
          solutionBody:
            "Every invoice is tracked, every follow-up stays consistent, and every payment is visible in one clean dashboard.",
          howTitle: "How it works",
          howKicker: "Typical flow",
          howSubtitle:
            "Straightforward sequence: what you do, then what PayPulss handles for you, we name who owns each step.",
          howConcernLabel: "Who’s involved",
          howFlowSteps: [
            {
              headline: "Bring clients and invoices into one hub",
              whoLabel: "You",
              whoHint: "Freelancers, solopreneurs, small teams, anyone who invoices and tracks payments.",
              body: "Add cases and due dates in minutes: PayPulss replaces scattered sheets with one readable list.",
            },
            {
              headline: "Watch due dates & draft reminders",
              whoLabel: "PayPulss",
              whoHint: "The app runs the surveillance and drafts messages, it isn’t someone calling clients for you.",
              body: "It flags what matters per your setup and drafts nudges (subject, tone, rhythm) aligned with your plan and settings.",
            },
            {
              headline: "Get paid smoother with clearer follow-up",
              whoLabel: "You & your clients",
              whoHint: "Commercial relationship stays yours; clients are simply guided to pay without endless back-and-forth.",
              body: "You stay in control when it matters and see paid vs late at a glance, no manual archaeology.",
            },
          ],
          aboutTitle: "Get to know us",
          aboutBody:
            "I’m El Fahmi Bilal, founder of PayPulss. The product comes from a simple observation: too many independents lose time, and cash flow, chasing invoices and awkward follow-ups. PayPulss is built to give you clarity: a readable case list, trustworthy statuses, reminders that match your brand, with less mental overhead. My values: transparency (you control where data lives), polished execution, and a tool that stays simple month after month.",
          aboutExpertiseTitle: "Expertise",
          aboutBullets: [
            "Product & UX, invoices, nudges, cashflow dashboard",
            "Modern web engineering (Next.js) and integrations (Supabase, email)",
            "Due-date follow-up automation and reminder workflows",
            "Quality and fast iteration without sacrificing clarity",
            "Long-term focus: a SaaS you rely on daily, not a gimmick",
          ],
          finalCtaTitle: "Stop chasing your money",
          finalCtaButton: "Start free",
          features: [
            { kind: "clients" as const, title: "Clients & invoices", body: "Centralize cases, amounts, and due dates without scattered spreadsheets." },
            { kind: "status" as const, title: "Paid / unpaid", body: "Each row shows a clear status so you know who to nudge first." },
            { kind: "remind" as const, title: "Email nudges", body: "Ready-to-send drafts, manual send in the MVP; automatic nudges ship on Pro and up." },
            { kind: "dash" as const, title: "Dashboard", body: "Outstanding, cash-in this month, average delay, cash health at a glance." },
            { kind: "auto" as const, title: "Automation", body: "In-product nudges by due date; on Agency, a second workspace for another brand or business line." },
            { kind: "data" as const, title: "Data you control", body: "Local mode or Supabase, you choose where the database lives." },
          ],
        };

  const featureCards: FeatureItem[] = t.features.map((f) => ({
    title: f.title,
    body: f.body,
    icon: featureIcon(f.kind),
  }));

  const planCardClass = (highlight: boolean) =>
    `pp-dashboard-card-interactive relative flex flex-col rounded-2xl border p-6 backdrop-blur-md ${
      highlight
        ? "border-[#34D399]/55 bg-[#0a1f35] shadow-[0_18px_44px_-14px_rgba(52,211,153,0.22),0_0_44px_-12px_rgba(139,92,246,0.18)] hover:border-[#34D399]/70 hover:shadow-[0_22px_52px_-12px_rgba(52,211,153,0.28),0_0_48px_-8px_rgba(139,92,246,0.18)]"
        : "border-white/15 bg-[#0a1628] shadow-[0_12px_36px_-14px_rgba(0,0,0,0.4)] hover:border-white/25 hover:shadow-[0_18px_44px_-12px_rgba(0,0,0,0.5),0_0_36px_-10px_rgba(139,92,246,0.16)]"
    }`;

  const resolvePlanCtaHref = (planId: PlanId): string => {
    if (planId === "free") return isAuthenticated ? "/dashboard?plan=free" : "/signup?plan=free";
    return isAuthenticated
      ? `/dashboard?plan=${planId}&billing=${billingCycle}`
      : `/signup?plan=${planId}&billing=${billingCycle}`;
  };

  return (
    <div className="relative min-h-screen overflow-x-clip antialiased text-slate-900" style={{ backgroundColor: BG }}>
      <div className="pp-landing-ambient" aria-hidden>
        <div
          className="pp-landing-ambient__blob left-[-20%] top-[-25%] h-[min(520px,55vw)] w-[min(520px,55vw)]"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.28) 0%, rgba(99,102,241,0.12) 42%, transparent 72%)" }}
        />
        <div
          className="pp-landing-ambient__blob pp-landing-ambient__blob--2 right-[-15%] bottom-[10%] h-[min(480px,50vw)] w-[min(480px,50vw)]"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.26) 0%, rgba(167,139,250,0.1) 45%, transparent 74%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(51,65,85,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(51,65,85,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <main className="relative z-[1]">
        {/* Section 1 : Hero plein viewport, image de fond statique (révolution tech) */}
        <section className="relative isolate flex min-h-[100svh] flex-col justify-center overflow-hidden bg-slate-50 px-5 pb-24 pt-12 sm:px-10 sm:pb-32 sm:pt-16 lg:pb-40">
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
            <div className="pp-hero-warp-layer pp-hero-warp-layer--a absolute inset-0">
              <Image
                src="/images/landing/hero-tech-revolution.png"
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
            <div className="pp-hero-warp-layer pp-hero-warp-layer--b absolute inset-0">
              <Image
                src="/images/landing/hero-tech-revolution.png"
                alt=""
                fill
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          </div>
          <div
            className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-white/55 via-white/30 to-slate-50/65"
            aria-hidden
          />
          <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-2 text-center sm:px-4">
            <HeroEntrance>
              <div className="mb-6 flex flex-col items-center gap-5 drop-shadow-[0_8px_30px_rgba(59,130,246,0.12)]">
                <div className="flex items-center justify-center gap-2.5">
                  <PayPulseLogo className="h-9 w-9 shrink-0 opacity-95 sm:h-10 sm:w-10" />
                  <span className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">PayPulss</span>
                </div>
                <span className="inline-flex items-center rounded-full border border-slate-300 bg-white/85 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-700 shadow-[0_0_0_1px_rgba(148,163,184,0.2)_inset] backdrop-blur-md sm:text-xs">
                  {t.heroBadge}
                </span>
              </div>
            </HeroEntrance>

            <HeroEntrance delay={0.55} className="relative mt-2 w-full">
              <h1 className="relative z-10 mx-auto max-w-[min(100%,52rem)] font-semibold tracking-tight text-slate-900 drop-shadow-[0_6px_20px_rgba(148,163,184,0.2)] [font-size:clamp(1.35rem,5.4vw,3.5rem)] [line-height:1.12]">
                <span className="pp-chromatic-hero-line block whitespace-nowrap text-slate-900">{t.heroLine1}</span>
                <span className="mt-1 block whitespace-nowrap bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-500 bg-clip-text text-transparent [text-shadow:0_0_30px_rgba(59,130,246,0.2)] sm:mt-2">
                  {t.heroLine2}
                </span>
              </h1>
            </HeroEntrance>

            <HeroEntrance delay={0.9} className="mt-8 max-w-2xl px-1">
              <p className="text-[15px] font-light leading-relaxed text-slate-700 sm:text-lg sm:leading-relaxed">
                {t.heroSubline}
              </p>
            </HeroEntrance>

            <HeroEntrance delay={1.15} className="mt-12 flex w-full max-w-2xl flex-col items-stretch gap-4 sm:flex-row sm:justify-center sm:gap-5">
              <motion.div
                className="inline-flex w-full sm:w-auto sm:min-w-[220px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 380, damping: 24 }}
              >
                <Link
                  href={isAuthenticated ? "/dashboard" : "/signup"}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-8 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_-12px_rgba(37,99,235,0.55),0_0_0_1px_rgba(255,255,255,0.08)_inset] transition hover:bg-[#1d4ed8] hover:shadow-[0_24px_56px_-10px_rgba(29,78,216,0.5)] sm:w-auto"
                >
                  {isAuthenticated ? t.ctaDashboard : t.ctaTrial}
                  <svg className="h-4 w-4 shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7v8" />
                  </svg>
                </Link>
              </motion.div>
              <motion.div
                className="inline-flex w-full sm:w-auto sm:min-w-[200px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 380, damping: 24 }}
              >
                <a
                  href={`#${t.demoAnchor}`}
                  className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
                >
                  {t.ctaPricing}
                </a>
              </motion.div>
            </HeroEntrance>

            <HeroEntrance delay={1.28} className="mt-4">
              <p className="text-xs font-medium text-slate-600 sm:text-sm">{t.microNoCard}</p>
            </HeroEntrance>

            <div className="mt-10 flex w-full justify-center">
              <PwaInstallButton labels={t.installLabels} />
            </div>
          </div>
        </section>

        <div className="hidden md:block">
          <PaypulssScrollPin trustIntro={t.heroTrustIntro} trustPills={t.heroTrustPills} />
        </div>

        {/* Section 2 & 3, Problème + Solution */}
        <ScrollShiftSection id="story" shift={1} className="scroll-mt-24 border-t border-slate-200/80 bg-gradient-to-b from-slate-100 to-slate-50 px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:gap-10">
            <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
              <Reveal className="rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-10">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-300/80">01</p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{t.problemTitle}</h2>
              <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base">{t.problemBody}</p>
              </Reveal>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} transition={{ type: "spring", stiffness: 280, damping: 22 }}>
              <Reveal
                className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200/95 p-8 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.14)] ring-1 ring-slate-200/70 backdrop-blur-sm sm:p-10"
                delay={0.08}
              >
                <LandingGreyWaveBackdrop />
                <div className="relative z-10">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-600">02</p>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{t.solutionTitle}</h2>
                  <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base">{t.solutionBody}</p>
                </div>
              </Reveal>
            </motion.div>
          </div>
        </ScrollShiftSection>

        <ScrollShiftSection id="features" shift={-1} className="scroll-mt-28 border-t border-slate-200 bg-white px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.featuresTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-3 max-w-2xl text-center text-slate-600" delay={0.06}>
              <p>{t.featuresSub}</p>
            </Reveal>
            <FeaturesRevealGrid items={featureCards} reduceMotion={reduceMotion} />
            <div className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={isAuthenticated ? "/dashboard" : "/signup"}
                  className="inline-flex items-center justify-center rounded-xl bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-[#1d4ed8]"
                >
                  {isAuthenticated ? t.ctaDashboard : t.ctaTrial}
                </Link>
              </motion.div>
              <a
                href={`#${t.demoAnchor}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
              >
                {t.ctaPricing}
              </a>
            </div>
          </div>
        </ScrollShiftSection>

        <section
          id="product-tour"
          className="scroll-mt-28 border-t border-slate-200 bg-slate-50 px-4 py-16 sm:px-6"
        >
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.visualShowcaseTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-3 max-w-2xl text-center text-slate-600" delay={0.06}>
              <p>{t.visualShowcaseSub}</p>
            </Reveal>
            <ProductTourMarquee
              scrollHint={t.visualShowcaseScrollHint}
              panels={[
                {
                  kind: "clients",
                  title: t.visualClientsTitle,
                  body: t.visualClientsBody,
                },
                {
                  kind: "reminders",
                  title: t.visualRelancesTitle,
                  body: t.visualRelancesBody,
                },
                {
                  kind: "treasury",
                  title: t.visualTreasuryTitle,
                  body: t.visualTreasuryBody,
                },
                {
                  kind: "deadlines",
                  title: t.visualMarqueeDueTitle,
                  body: t.visualMarqueeDueBody,
                },
                {
                  kind: "security",
                  title: t.visualMarqueeSecurityTitle,
                  body: t.visualMarqueeSecurityBody,
                },
                {
                  kind: "rhythm",
                  title: t.visualMarqueeRhythmTitle,
                  body: t.visualMarqueeRhythmBody,
                },
              ]}
            />
          </div>
        </section>

        <section id="recurring-cycle" className="scroll-mt-28 border-t border-slate-200 bg-white px-4 py-16 sm:px-6">
          <div className="mx-auto flex max-w-2xl flex-col items-stretch gap-10">
            <Reveal className="flex min-w-0 flex-col justify-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.recurringTitle}</h2>
              <p className="mt-5 text-sm leading-relaxed text-slate-600 sm:text-base">{t.recurringBody}</p>
            </Reveal>
            <Reveal className="relative flex w-full justify-center" delay={0.08}>
              {/* Même empilement vertical partout (mobile / tablette / desktop), largeur type « carte » */}
              <div
                className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_15%_10%,rgba(139,92,246,0.2),transparent_45%),linear-gradient(160deg,#030712,#0b1025)] p-5 shadow-[0_24px_56px_-12px_rgba(0,0,0,0.45),0_0_40px_-8px_rgba(139,92,246,0.1)] ring-1 ring-white/10 sm:p-6"
                role="img"
                aria-label={t.recurringImgAlt}
              >
                <motion.div
                  className="pointer-events-none absolute inset-0"
                  initial={false}
                  animate={{ opacity: [0.85, 1, 0.86] }}
                  transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="relative flex flex-col gap-4">
                  <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/12 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100/90">
                        {t.recurringStep1Label}
                      </p>
                      <span className="shrink-0 rounded-full bg-emerald-400/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-100">
                        {t.recurringStep1Badge}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-100/90">{t.recurringStep1Body}</p>
                  </div>
                  <div className="flex justify-center">
                    <motion.div
                      className="rounded-full border border-sky-400/40 bg-sky-500/10 p-2 text-sky-200 shadow-lg"
                      animate={{ rotate: [0, -12, 0, 12, 0], scale: [1, 1.08, 1] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
                      aria-label={t.recurringArrowAria}
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                      </svg>
                    </motion.div>
                  </div>
                  <div className="rounded-xl border border-orange-300/35 bg-orange-500/12 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-100/90">
                        {t.recurringStep2Label}
                      </p>
                      <span className="max-w-[min(100%,11rem)] shrink-0 rounded-full bg-orange-400/25 px-2.5 py-1 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide text-orange-100">
                        {t.recurringStep2Badge}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-100/90">{t.recurringStep2Body}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <ScrollShiftSection id={t.demoAnchor} shift={1} className="scroll-mt-28 border-t border-slate-200 bg-white px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.demoTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-3 max-w-2xl text-center text-slate-600" delay={0.05}>
              <p>{t.demoSub}</p>
            </Reveal>
            <div className="mt-14 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
              <motion.ul
                className="space-y-4 text-left"
                initial="hidden"
                whileInView="show"
                viewport={{ margin: "-40px", amount: 0.2 }}
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
                }}
              >
                {t.demoBullets.map((line) => (
                  <motion.li
                    key={line}
                    variants={{
                      hidden: { opacity: 0, y: 14 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] } },
                    }}
                    className="flex gap-3 text-sm leading-relaxed text-slate-700"
                  >
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#34D399]/15 text-xs font-bold text-[#34D399] shadow-[0_0_16px_rgba(52,211,153,0.12)]" aria-hidden>
                      ✓
                    </span>
                    <span>{line}</span>
                  </motion.li>
                ))}
              </motion.ul>
              <div className="flex min-w-0 justify-center lg:justify-end">
                <motion.div
                  className="w-full max-w-xl lg:max-w-[min(100%,520px)] pr-3 pt-3 sm:pr-5 sm:pt-5 lg:pr-6 lg:pt-6"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px", amount: 0.2 }}
                  transition={{ duration: 0.62, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                >
                  <DualThemeDashboardPreview
                    charts={t.chartsMock}
                    hint={t.demoModeHint}
                    ariaLabelDark={t.demoModeDark}
                    ariaLabelLight={t.demoModeLight}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </ScrollShiftSection>

        {/* Fondateur + valeurs (après l’explication produit) */}
        <section id="about" className="scroll-mt-28 border-t border-slate-200 bg-slate-50 px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <Reveal className="relative mx-auto w-full max-w-md lg:mx-0">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/[0.1] bg-[#0a0a0a] shadow-[0_40px_100px_-40px_rgba(139,92,246,0.35),0_24px_64px_-24px_rgba(0,0,0,0.85)]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <Image
                  src={FOUNDER_IMAGE_SRC}
                  alt={FOUNDER_NAME}
                  fill
                  className="object-contain object-bottom"
                  sizes="(max-width: 1024px) 90vw, 448px"
                  unoptimized
                />
                <div className="absolute inset-x-0 bottom-0 border-t border-white/[0.08] bg-black/55 px-5 py-4 backdrop-blur-md lg:hidden">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#34D399]/90">{t.founderKicker}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{FOUNDER_NAME}</p>
                  <p className="text-sm text-slate-400">{t.founderRole}</p>
                </div>
              </div>
            </Reveal>
            <div className="min-w-0 text-left">
              <Reveal>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{t.aboutTitle}</h2>
              </Reveal>
              <Reveal className="mt-6 text-base leading-relaxed text-slate-700 sm:text-lg" delay={0.06}>
                <p>{t.aboutBody}</p>
              </Reveal>
              <Reveal className="mt-10" delay={0.1}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#34D399]">{t.aboutExpertiseTitle}</p>
                <ul className="mt-4 space-y-3">
                  {t.aboutBullets.map((line) => (
                    <li key={line} className="flex gap-3 text-sm leading-relaxed text-slate-700 sm:text-base">
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.6)]"
                        aria-hidden
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal className="mt-10 hidden border-t border-white/[0.08] pt-8 lg:block" delay={0.12}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{t.founderKicker}</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{FOUNDER_NAME}</p>
                <p className="text-sm text-slate-600">{t.founderRole}</p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* Section 5, Preuve sociale + stats (comptage à l’entrée viewport) */}
        <ProofStatsSection
          locale={locale === "fr" ? "fr" : "en"}
          copy={{
            socialProof: t.socialProof,
            statsTitle: t.statsTitle,
            statsSub: t.statsSub,
            stat1Lab: t.stat1Lab,
            stat2Lab: t.stat2Lab,
            stat3Lab: t.stat3Lab,
          }}
        />

        <section id="how" className="scroll-mt-28 border-t border-slate-200 bg-gradient-to-b from-white to-slate-50/80 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600/90">{t.howKicker}</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.howTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-4 max-w-3xl text-center text-sm leading-relaxed text-slate-600 sm:text-base" delay={0.05}>
              <p>{t.howSubtitle}</p>
            </Reveal>

            {/* Aperçu rapide (desktop), parcours 1 · 2 · 3 lisible */}
            <div className="mt-10 hidden md:flex md:items-stretch md:justify-between md:gap-3 lg:gap-5">
              {t.howFlowSteps.flatMap((step, idx) => {
                const last = idx === t.howFlowSteps.length - 1;
                const mini = (
                  <div
                    key={step.headline}
                    className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t.howConcernLabel}</p>
                        <p className="text-sm font-semibold text-slate-900">{step.whoLabel}</p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-snug text-slate-600">{step.headline}</p>
                  </div>
                );
                if (last) return [mini];
                return [
                  mini,
                  <div
                    key={`how-arrow-${idx}`}
                    className="flex shrink-0 items-center self-center px-1 text-slate-300 lg:px-2"
                    aria-hidden
                  >
                    <svg className="h-7 w-7 lg:h-8 lg:w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </div>,
                ];
              })}
            </div>

            <motion.div
              className="mt-10 grid gap-5 sm:gap-6 lg:grid-cols-3"
              initial="hidden"
              whileInView="show"
              viewport={{ margin: "-40px", amount: 0.15 }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            >
              {t.howFlowSteps.map((step, idx) => (
                <motion.div
                  key={step.headline}
                  variants={{
                    hidden: { opacity: 0, y: 18 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } },
                  }}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.12)]"
                  whileHover={{
                    y: -3,
                    borderColor: "rgba(139,92,246,0.35)",
                    boxShadow: "0 20px 44px -24px rgba(139,92,246,0.2)",
                  }}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{t.howConcernLabel}</span>
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-800">
                      {step.whoLabel}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">{step.headline}</h3>
                  <p className="mt-2 text-xs font-medium leading-relaxed text-violet-700/90">{step.whoHint}</p>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{step.body}</p>
                </motion.div>
              ))}
            </motion.div>
            <Reveal className="mt-12 flex flex-wrap justify-center gap-4" delay={0.06}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={isAuthenticated ? "/dashboard" : "/signup"}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
                >
                  {t.howCtaSignup}
                </Link>
              </motion.div>
              <a
                href={`#${t.demoAnchor}`}
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-3.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                {t.howCtaDemo}
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-8 py-3.5 text-sm font-semibold text-violet-900 transition hover:border-violet-300 hover:bg-violet-100"
              >
                {t.howCtaContact}
              </Link>
            </Reveal>
          </div>
        </section>

        <ScrollShiftSection id={t.pricingAnchor} shift={-1} className="scroll-mt-28 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">{t.pricingTitle}</h2>
              <p className="mt-4 text-slate-600">{t.pricingSub}</p>
              <div className="mx-auto mt-8 flex max-w-md flex-col items-center gap-1">
                <div
                  role="tablist"
                  aria-label={locale === "fr" ? "Choix de facturation mensuelle ou annuelle" : "Choose monthly or yearly billing"}
                  className="relative flex h-[52px] w-[min(100%,20.5rem)] shrink-0 items-stretch rounded-full border border-slate-200/95 bg-slate-100/90 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_10px_28px_-14px_rgba(15,23,42,0.18)] sm:h-14 sm:w-[21rem]"
                >
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-2 left-2 z-0 w-[calc(50%-0.5rem)] rounded-full bg-white shadow-[0_4px_16px_rgba(15,23,42,0.1),0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.06]"
                    initial={false}
                    animate={{
                      /* 100% = exactement une demi-piste (même largeur que le thumb), aligné sur le padding p-2 */
                      x: billingCycle === "annual" ? "100%" : 0,
                    }}
                    transition={
                      reduceMotion
                        ? { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
                        : { type: "spring", stiffness: 520, damping: 34, mass: 0.72 }
                    }
                  />
                  <motion.button
                    type="button"
                    role="tab"
                    aria-selected={billingCycle === "monthly"}
                    onClick={() => setBillingCycle("monthly")}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    className={`relative z-10 flex min-w-0 flex-1 items-center justify-center rounded-full px-1 text-sm font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 sm:text-[15px] ${
                      billingCycle === "monthly" ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t.pricingBillingMonthly}
                  </motion.button>
                  <motion.button
                    type="button"
                    role="tab"
                    aria-selected={billingCycle === "annual"}
                    onClick={() => setBillingCycle("annual")}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    className={`relative z-10 flex min-w-0 flex-1 items-center justify-center rounded-full px-1 text-sm font-semibold outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 sm:text-[15px] ${
                      billingCycle === "annual" ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span className="inline-flex max-w-full items-center justify-center gap-2 whitespace-nowrap sm:gap-2.5">
                      <span>{t.pricingBillingAnnual}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums tracking-tight sm:text-[11px] ${
                          billingCycle === "annual"
                            ? "bg-emerald-600 text-white shadow-sm shadow-emerald-700/20"
                            : "border border-emerald-600/20 bg-emerald-500/10 text-emerald-800"
                        }`}
                      >
                        {t.pricingAnnualSavingsBadge}
                      </span>
                    </span>
                  </motion.button>
                </div>
                <p className="mt-3 max-w-sm text-center text-xs font-semibold leading-snug text-emerald-800 sm:text-sm">
                  {t.pricingAnnualSavingsNote}
                </p>
              </div>
            </Reveal>
            <motion.div
              className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
              initial="hidden"
              whileInView="show"
              viewport={{ margin: "-48px", amount: 0.18, once: true }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.22, delayChildren: 0.1 } },
              }}
            >
              {MARKETING_PLANS.map((plan) => {
                const localized = locale === "fr" ? PLAN_FR[plan.id] : null;
                const name = localized?.name ?? plan.name;
                const description = localized?.description ?? plan.description;
                const features = localized?.features ?? plan.features;
                const annualPricing = ANNUAL_PRICING[plan.id];
                const showAnnual = billingCycle === "annual" && Boolean(annualPricing);
                const shownPrice = showAnnual ? annualPricing!.annual : plan.price;
                const period = showAnnual
                  ? locale === "fr"
                    ? "/an"
                    : "/year"
                  : localized?.periodLabel ?? (plan.period === "forever" ? (locale === "fr" ? "gratuit" : "free") : plan.period);
                const cta = localized?.cta ?? (plan.id === "free" ? (locale === "fr" ? "Tester gratuitement" : "Start free") : t.planCtaEnFallback);
                const highlight = Boolean(plan.highlighted);

                return (
                  <motion.div
                    key={plan.id}
                    className={planCardClass(highlight)}
                    variants={{
                      hidden: { opacity: 0, y: 26 },
                      show: { opacity: 1, y: 0, transition: { duration: 1.05, ease: [0.22, 1, 0.36, 1] } },
                    }}
                    whileHover={{
                      y: -4,
                      transition: { type: "spring", stiffness: 400, damping: 24 },
                    }}
                  >
                    {highlight ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#34D399] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#041018]">
                        {t.popular}
                      </span>
                    ) : null}
                    <h3 className="text-lg font-bold text-white">{name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{description}</p>
                    <p className="mt-6 flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight text-white">{shownPrice}</span>
                      <span className="text-sm text-slate-500">{period}</span>
                    </p>
                    {showAnnual ? (
                      <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm">
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-300">
                          {t.pricingAnnualSavingsBadge}
                        </span>
                        <span className="text-slate-400">
                          {t.pricingAnnualOldLabel}{" "}
                          <span className="line-through decoration-slate-500/80">{annualPricing!.oldAnnual}</span>
                        </span>
                      </div>
                    ) : null}
                    <ul className="mt-6 flex-1 space-y-2.5 text-sm text-slate-300">
                      {features.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className="shrink-0" style={{ color: ACCENT }} aria-hidden>
                            ✓
                          </span>
                          {line}
                        </li>
                      ))}
                    </ul>
                    <motion.div className="mt-8" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Link
                        href={resolvePlanCtaHref(plan.id)}
                        className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                          highlight
                            ? "bg-gradient-to-r from-[#34D399] to-[#6EE7B7] text-[#041018] shadow-[0_8px_28px_rgba(52,211,153,0.25)] hover:shadow-[0_12px_36px_rgba(52,211,153,0.32)]"
                            : "border border-white/15 bg-white/[0.06] text-white shadow-inner shadow-white/[0.02] backdrop-blur-sm hover:border-violet-400/30 hover:bg-white/10"
                        }`}
                      >
                        {cta}
                      </Link>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </ScrollShiftSection>

        <section id="faq" className="scroll-mt-28 border-t border-slate-200 bg-slate-50 px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{t.faqTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-3 max-w-xl text-center text-slate-600" delay={0.05}>
              <p>{t.faqSub}</p>
            </Reveal>
            <motion.div
              className="mt-12 space-y-3"
              initial="hidden"
              whileInView="show"
              viewport={{ margin: "-24px", amount: 0.2 }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
              }}
            >
              {t.faqItems.map((item) => (
                <motion.div
                  key={item.q}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
                  }}
                >
                  <details className="group rounded-2xl border border-white/10 bg-[#071528]/75 px-4 py-1 shadow-lg shadow-black/20 backdrop-blur-md open:border-white/18 open:bg-[#071528]/90 [&_summary]:cursor-pointer">
                  <summary className="flex list-none items-center justify-between gap-3 py-3 text-sm font-semibold text-white outline-none ring-offset-2 ring-offset-[#06101f] focus-visible:ring-2 focus-visible:ring-[#34D399]/70 [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-400 transition group-open:rotate-45 group-open:border-[#34D399]/40 group-open:text-[#34D399]"
                      aria-hidden
                    >
                      +
                    </span>
                  </summary>
                  <p className="border-t border-white/10 pb-4 pt-2 text-sm leading-relaxed text-slate-400">{item.a}</p>
                  </details>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-white px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <Reveal className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Persona</p>
              <h2 className="mt-3 text-xl font-bold text-slate-900 sm:text-2xl">{t.personaTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-6 max-w-2xl" delay={0.06}>
              <blockquote className="rounded-r-xl border-l-[3px] border-[#34D399] bg-slate-50 py-4 pl-5 pr-4 text-left text-base italic leading-relaxed text-slate-800 sm:text-lg">
                {t.personaQuote}
              </blockquote>
            </Reveal>
            <motion.div
              className="mt-12 grid gap-6 sm:grid-cols-2"
              initial="hidden"
              whileInView="show"
              viewport={{ margin: "-40px", amount: 0.2 }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
              }}
            >
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-[#1a0a14]/95 via-[#06101f]/90 to-[#0a0510]/95 p-6 shadow-lg shadow-black/30 backdrop-blur-md"
                whileHover={{
                  y: -4,
                  borderColor: "rgba(244,63,94,0.32)",
                  boxShadow: "0 20px 44px -12px rgba(0,0,0,0.5), 0 0 36px -10px rgba(244,63,94,0.18)",
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-rose-500/12 blur-3xl"
                />
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/15 text-rose-300">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    </svg>
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">{t.beforeTitle}</p>
                </div>
                <ul aria-hidden className="mt-4 space-y-1.5 rounded-xl border border-rose-500/12 bg-black/30 p-3">
                  {t.beforeRows.map((row, i) => (
                    <li
                      key={`b-${i}`}
                      className="flex items-center justify-between gap-2 text-[11px] sm:text-xs"
                    >
                      <span className={`min-w-0 flex-1 truncate ${i === 1 ? "text-slate-500 line-through" : i === 2 ? "italic text-slate-500" : "text-slate-400"}`}>
                        {row.name}
                      </span>
                      <span className="shrink-0 tabular-nums text-slate-500">{row.amount}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          i === 0
                            ? "bg-rose-500/18 text-rose-200 ring-1 ring-rose-400/30"
                            : i === 1
                              ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/25"
                              : "bg-slate-700/40 text-slate-400 ring-1 ring-slate-600/40"
                        }`}
                      >
                        {row.state}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">{t.beforeBody}</p>
              </motion.div>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="relative overflow-hidden rounded-2xl border border-[#34D399]/30 bg-gradient-to-br from-[#062018]/95 via-[#0a1f35]/90 to-[#06101f]/95 p-6 shadow-[0_16px_40px_-12px_rgba(52,211,153,0.18)] backdrop-blur-md"
                whileHover={{
                  y: -4,
                  borderColor: "rgba(52,211,153,0.55)",
                  boxShadow: "0 22px 48px -10px rgba(52,211,153,0.22), 0 0 40px -8px rgba(139,92,246,0.14)",
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#34D399]/14 blur-3xl"
                />
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#34D399]/40 bg-[#34D399]/15"
                    style={{ color: ACCENT }}
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: ACCENT }}>
                    {t.afterTitle}
                  </p>
                </div>
                <ul aria-hidden className="mt-4 space-y-1.5 rounded-xl border border-[#34D399]/15 bg-black/30 p-3">
                  {t.afterRows.map((row, i) => (
                    <li
                      key={`a-${i}`}
                      className="flex items-center justify-between gap-2 text-[11px] sm:text-xs"
                    >
                      <span className="min-w-0 flex-1 truncate text-slate-200">{row.name}</span>
                      <span className="shrink-0 font-semibold tabular-nums" style={{ color: ACCENT }}>
                        {row.amount}
                      </span>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          row.kind === "paid"
                            ? "bg-[#34D399]/18 text-emerald-200 ring-1 ring-[#34D399]/40"
                            : row.kind === "scheduled"
                              ? "bg-violet-500/18 text-violet-200 ring-1 ring-violet-400/35"
                              : "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/30"
                        }`}
                      >
                        <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} aria-hidden>
                          {row.kind === "scheduled" ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          )}
                        </svg>
                        {row.state}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm leading-relaxed text-slate-200">{t.afterBody}</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 px-4 py-18 sm:px-6">
          <Reveal className="relative mx-auto flex max-w-4xl flex-col items-center overflow-hidden rounded-3xl border border-white/70 bg-white px-6 py-12 text-center shadow-[0_22px_56px_-24px_rgba(15,23,42,0.18)]">
            {/* Halos de marque, mint, gauche et violet, droite, sans animation lourde */}
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 -top-20 h-80 w-80 rounded-full opacity-70"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(52,211,153,0.32), transparent 65%)",
                filter: "blur(28px)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full opacity-80"
              style={{
                background: "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.36), transparent 65%)",
                filter: "blur(30px)",
              }}
            />
            {/* Liseré de marque, dégradé du logo */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
              style={{
                background: "linear-gradient(90deg, #34D399 0%, #6EE7B7 18%, #C4B5FD 60%, #8B5CF6 100%)",
              }}
            />
            <div className="relative z-10 flex flex-col items-center px-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{t.finalCtaTitle}</h2>
              <div className="mt-8 flex w-full max-w-2xl flex-col items-stretch gap-4 sm:flex-row sm:justify-center sm:gap-5">
                <motion.div
                  className="inline-flex w-full sm:w-auto sm:min-w-[220px]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 380, damping: 24 }}
                >
                  <Link
                    href={isAuthenticated ? "/dashboard" : "/signup"}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-8 py-4 text-sm font-semibold text-white shadow-[0_20px_50px_-12px_rgba(37,99,235,0.55),0_0_0_1px_rgba(255,255,255,0.08)_inset] transition hover:bg-[#1d4ed8] hover:shadow-[0_24px_56px_-10px_rgba(29,78,216,0.5)] sm:w-auto"
                  >
                    {t.finalCtaButton}
                    <svg className="h-4 w-4 shrink-0 opacity-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H9M17 7v8" />
                    </svg>
                  </Link>
                </motion.div>
                <motion.div
                  className="inline-flex w-full sm:w-auto sm:min-w-[200px]"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 380, damping: 24 }}
                >
                  <Link
                    href="/contact"
                    className="inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-8 py-4 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur-md transition hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
                  >
                    {t.howCtaContact}
                  </Link>
                </motion.div>
              </div>
            </div>
          </Reveal>
        </section>

        <footer className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <PayPulseLogo className="h-9 w-9 shrink-0 text-[#34D399]" />
              <span className="font-semibold text-slate-900">PayPulss</span>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
              <div>
                <p className="font-semibold text-slate-400">{t.footerProduct}</p>
                <ul className="mt-3 space-y-2 text-slate-500">
                  <li>
                    <a href="#features" className="transition hover:text-[#34D399]">
                      {t.footerLinks.features}
                    </a>
                  </li>
                  <li>
                    <a href={`#${t.demoAnchor}`} className="transition hover:text-[#34D399]">
                      {t.footerLinks.preview}
                    </a>
                  </li>
                  <li>
                    <a href={`#${t.pricingAnchor}`} className="transition hover:text-[#34D399]">
                      {t.footerLinks.pricing}
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="transition hover:text-[#34D399]">
                      {t.footerLinks.faq}
                    </a>
                  </li>
                  <li>
                    <a href="#about" className="transition hover:text-[#34D399]">
                      {t.footerLinks.about}
                    </a>
                  </li>
                  <li>
                    <a href="#product-tour" className="transition hover:text-[#34D399]">
                      {t.footerLinks.footerProductTour}
                    </a>
                  </li>
                  <li>
                    <a href="#how" className="transition hover:text-[#34D399]">
                      {t.footerLinks.footerHowLink}
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-400">{t.footerCompany}</p>
                <ul className="mt-3 space-y-2 text-slate-500">
                  <li>
                    <Link href="/a-propos" className="transition hover:text-[#34D399]">
                      {t.footerLinks.founder}
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="transition hover:text-[#34D399]">
                      {t.footerLinks.contact}
                    </Link>
                  </li>
                  <li>
                    <a
                      href="mailto:contact@paypulss.com?subject=Contact%20Paypulss"
                      className="transition hover:text-[#34D399]"
                    >
                      {t.footerLinks.contactEmail}
                    </a>
                  </li>
                  <li>
                    <span className="cursor-default">{t.footerLinks.careers}</span>
                  </li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="font-semibold text-slate-400">{t.footerLegal}</p>
                <ul className="mt-3 space-y-2 text-slate-500">
                  <li>
                    <Link href="/legal" className="transition hover:text-[#34D399]">
                      {t.footerLinks.legalHub}
                    </Link>
                  </li>
                  <li>
                    <Link href="/mentions-legales" className="transition hover:text-[#34D399]">
                      {t.footerLinks.mentions}
                    </Link>
                  </li>
                  <li>
                    <Link href="/droits-securite-donnees" className="transition hover:text-[#34D399]">
                      {t.footerLinks.security}
                    </Link>
                  </li>
                  <li>
                    <Link href="/confidentialite" className="transition hover:text-[#34D399]">
                      {t.footerLinks.privacy}
                    </Link>
                  </li>
                  <li>
                    <Link href="/conditions-utilisation" className="transition hover:text-[#34D399]">
                      {t.footerLinks.terms}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-10 max-w-6xl text-center text-xs text-slate-600">
            © {new Date().getFullYear()} PayPulss
          </p>
        </footer>
      </main>
    </div>
  );
}
