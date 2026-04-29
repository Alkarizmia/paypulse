"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useId, useState, type ReactNode } from "react";
import { PayPulseLogo } from "@/app/dashboard/pay-pulse-logo";
import { MARKETING_PLANS, type PlanId } from "@/lib/plans";
import { useLocale } from "@/app/locale-context";
import { useAuth } from "@/app/auth-context";
import { PwaInstallButton } from "@/app/pwa-install-button";
import {
  HeroHeadlineGlow,
  HeroWingAurora,
  LandingStarfield,
  MotionHeroTitle,
  MotionKicker,
  Reveal,
  SoftFloat,
  SoftFloatDashboard,
} from "@/app/landing/landing-motion";

const ACCENT = "#3DFF8A";
const BG = "#050505";
const FOUNDER_NAME = "El Fahmi Bilal";
const FOUNDER_IMAGE_SRC = "/images/founder-bilal.png";
const RECURRING_CYCLE_IMAGE_SRC = "/images/recurring-cycle-illustration.png";

/** Flèche demi-tour décorative : zoom uniquement sur ce picto au survol. */
function RecurringCycleArrowDecor({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div
      className="group/arrow pointer-events-auto absolute right-[2.5%] top-[3.5%] z-10 flex h-11 w-11 cursor-default items-center justify-center rounded-xl border border-sky-500/50 bg-sky-950/55 p-1.5 shadow-md shadow-black/35 backdrop-blur-[2px] sm:right-[3.5%] sm:top-[4%] sm:h-12 sm:w-12"
      role="img"
      aria-label={ariaLabel}
    >
      <svg
        className="h-full w-full max-h-[1.35rem] max-w-[1.35rem] text-sky-200 transition-transform duration-300 ease-out group-hover/arrow:scale-[1.28] motion-reduce:transition-none motion-reduce:group-hover/arrow:scale-100 sm:max-h-6 sm:max-w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
      </svg>
    </div>
  );
}

function FounderTrust({ kicker, role }: { kicker: string; role: string }) {
  const [photoVisible, setPhotoVisible] = useState(true);
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="mt-10 flex max-w-xl items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3.5 shadow-lg shadow-violet-950/20 backdrop-blur-md sm:px-5"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.52, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      whileHover={
        reduceMotion
          ? undefined
          : {
              y: -3,
              borderColor: "rgba(255,255,255,0.16)",
              boxShadow:
                "0 20px 48px -12px rgba(0,0,0,0.45), 0 0 40px -8px rgba(139,92,246,0.18), 0 0 0 1px rgba(167,139,250,0.12)",
            }
      }
    >
      <div className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-xl ring-2 ring-[#3DFF8A]/35 shadow-lg shadow-black/30">
        {photoVisible ? (
          <Image
            src={FOUNDER_IMAGE_SRC}
            alt={FOUNDER_NAME}
            width={144}
            height={144}
            className="h-full w-full object-cover object-[center_15%]"
            sizes="72px"
            unoptimized
            onError={() => setPhotoVisible(false)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-600 via-[#0a1f35] to-emerald-600 text-sm font-bold tracking-tight text-white">
            EB
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#3DFF8A]/90">{kicker}</p>
        <p className="mt-1 truncate text-base font-bold text-white">{FOUNDER_NAME}</p>
        <p className="text-sm text-slate-400">{role}</p>
      </div>
    </motion.div>
  );
}

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
    description: "Plusieurs marques, plusieurs personnes — un suivi qui reste lisible.",
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
            className="relative h-5 w-9 rounded-full bg-[#3DFF8A]/30 transition"
            aria-label="Toggle"
          >
            <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-[#3DFF8A] shadow" />
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

type ChartsMockCopy = {
  windowTitle: string;
  pending: string;
  pendingVal: string;
  received: string;
  receivedVal: string;
  receivedHint: string;
  overdue: string;
  overdueVal: string;
  evolution: string;
  evolutionHint: string;
  distribution: string;
  paid: string;
  pendingL: string;
  overdueL: string;
  totalLabel: string;
  monthLabels: readonly [string, string, string, string, string, string];
};

/** Aperçu marketing des cartes + graphiques (style dashboard réel). */
function DashboardChartsMock({ charts, className }: { charts: ChartsMockCopy; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const fillId = `pp-land-chart-${uid}`;
  const pad = 20;
  const h = 108;
  const w = 360;
  const values = [42, 55, 48, 72, 68, 88];
  const max = Math.max(...values);
  const min = Math.min(...values) * 0.85;
  const span = max - min || 1;
  const n = values.length;
  const pts = values
    .map((v, i) => {
      const x = pad + (n <= 1 ? 0 : (i * (w - pad * 2)) / (n - 1));
      const y = h - ((v - min) / span) * (h - 18);
      return `${x},${y}`;
    })
    .join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  const paidPct = 58;
  const pendPct = 27;
  const overPct = 15;

  return (
    <div
      className={`mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-[#08080c]/95 shadow-2xl shadow-black/40 backdrop-blur-sm lg:mx-0 lg:max-w-none ${className ?? ""}`}
    >
      <div className="flex items-center gap-2 border-b border-white/[0.08] bg-[#0c0c12] px-3 py-2.5">
        <span className="h-2 w-2 rounded-full bg-red-400/90" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-amber-400/90" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-emerald-400/90" aria-hidden />
        <span className="ml-1 truncate text-[11px] font-medium text-slate-500">{charts.windowTitle}</span>
      </div>
      <div className="space-y-3 p-3 sm:p-4">
        <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-3">
          <div className="min-w-0 rounded-xl border border-white/[0.08] bg-[#14141c] p-2.5 sm:p-3">
            <p className="truncate text-[9px] font-medium uppercase tracking-wide text-slate-500 sm:text-[10px]">{charts.pending}</p>
            <p className="mt-1.5 truncate text-base font-semibold tabular-nums text-white sm:text-lg">{charts.pendingVal}</p>
          </div>
          <div className="min-w-0 rounded-xl border border-white/[0.08] bg-[#14141c] p-2.5 sm:p-3">
            <p className="truncate text-[9px] font-medium uppercase tracking-wide text-slate-500 sm:text-[10px]">{charts.received}</p>
            <p className="mt-1.5 truncate text-base font-semibold tabular-nums text-white sm:text-lg">{charts.receivedVal}</p>
            <p className="mt-0.5 truncate text-[9px] font-medium text-emerald-400/90">{charts.receivedHint}</p>
          </div>
          <div className="min-w-0 rounded-xl border border-white/[0.08] bg-[#14141c] p-2.5 sm:p-3">
            <p className="truncate text-[9px] font-medium uppercase tracking-wide text-slate-500 sm:text-[10px]">{charts.overdue}</p>
            <p className="mt-1.5 truncate text-2xl font-semibold tabular-nums text-white sm:text-3xl">{charts.overdueVal}</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#14141c] p-3 sm:p-4">
          <h3 className="text-xs font-semibold text-white sm:text-sm">{charts.evolution}</h3>
          <p className="mt-0.5 text-[10px] leading-snug text-slate-500">{charts.evolutionHint}</p>
          <div className="mt-3 h-28 sm:h-32">
            <svg viewBox={`0 0 ${w} ${h}`} className="h-full w-full" preserveAspectRatio="none" aria-hidden>
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.38" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline fill="none" stroke="#475569" strokeWidth="1" strokeDasharray="4 6" points={`0,${h - 8} ${w},${h - 8}`} />
              <polygon fill={`url(#${fillId})`} points={area} />
              <polyline
                fill="none"
                stroke="#a78bfa"
                strokeWidth="2.25"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={pts}
              />
              {values.map((v, i) => {
                const x = pad + (n <= 1 ? 0 : (i * (w - pad * 2)) / (n - 1));
                const y = h - ((v - min) / span) * (h - 18);
                return <circle key={i} cx={x} cy={y} r="3.5" fill="#c4b5fd" stroke="#7c3aed" strokeWidth="1.25" />;
              })}
            </svg>
            <div className="mt-1 flex justify-between gap-1 px-0.5 text-[9px] font-medium uppercase tracking-wider text-slate-500 sm:text-[10px]">
              {charts.monthLabels.map((m, mi) => (
                <span key={`${mi}-${m}`} className="min-w-0 truncate text-center">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-[#14141c] p-3 sm:p-4">
          <h3 className="text-xs font-semibold text-white sm:text-sm">{charts.distribution}</h3>
          <div className="mt-3 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
          <div className="relative mx-auto grid h-28 w-28 shrink-0 place-items-center sm:h-32 sm:w-32">
            <div
              className="col-start-1 row-start-1 h-full w-full rounded-full p-[9px]"
              style={{
                background: `conic-gradient(from -90deg, #8b5cf6 0 ${paidPct}%, #3b82f6 ${paidPct}% ${paidPct + pendPct}%, #fb923c ${paidPct + pendPct}% 100%)`,
              }}
            >
              <div className="flex h-full w-full items-center justify-center rounded-full bg-[#14141c]">
                <div className="text-center">
                  <span className="block text-[9px] uppercase tracking-wide text-slate-500">{charts.totalLabel}</span>
                  <span className="text-xs font-bold tabular-nums text-white sm:text-sm">100%</span>
                </div>
              </div>
            </div>
          </div>
          <ul className="min-w-0 flex-1 space-y-2 text-left text-[11px] text-slate-300 sm:text-xs">
            <li className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-violet-500" aria-hidden />
              <span className="truncate">
                {charts.paid} <span className="text-slate-500">({paidPct}%)</span>
              </span>
            </li>
            <li className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" aria-hidden />
              <span className="truncate">
                {charts.pendingL} <span className="text-slate-500">({pendPct}%)</span>
              </span>
            </li>
            <li className="flex min-w-0 items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-orange-400" aria-hidden />
              <span className="truncate">
                {charts.overdueL} <span className="text-slate-500">({overPct}%)</span>
              </span>
            </li>
          </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

type FeatureItem = { title: string; body: string; icon: ReactNode };

function featureIcon(kind: "clients" | "status" | "remind" | "dash" | "auto" | "data") {
  const stroke = { strokeWidth: 1.75 as const, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const common = "h-6 w-6 shrink-0 text-[#3DFF8A]";
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
  const reduceMotion = useReducedMotion();

  const t =
    locale === "fr"
      ? {
          product: "Factures et relances pour freelances",
          title: "Recuperez votre argent. Automatiquement.",
          body: "PayPulse relance vos clients a votre place jusqu'au paiement.",
          ctaTrial: "Commencer gratuitement",
          ctaDashboard: "Aller au dashboard",
          ctaPricing: "Voir comment ca marche",
          demoAnchor: "demo",
          pricingAnchor: "pricing",
          featuresTitle: "Tout ce qu’il faut pour suivre l’argent",
          featuresSub: "Six briques pensées pour les indépendants : de la saisie à la relance, sans tableur.",
          recurringTitle: "Même client, mois après mois — sans tout recréer",
          recurringBody:
            "Quand une facture est payée, une petite flèche demi-tour à côté du badge « Payé » crée une nouvelle ligne pour le mois suivant (nom « x2 », « x3 »…), impayée avec la nouvelle échéance, sans toucher à l’ancienne ligne qui reste « Payée » avec sa date. Le bilan et les graphiques gardent ainsi une ligne par période, lisible pour vous et pour le client.",
          recurringImgAlt:
            "Illustration : carte facture avec badge Payé ; la flèche demi-tour à côté est un aperçu interactif du produit.",
          recurringArrowAria: "Aperçu : flèche demi-tour pour la facture du mois suivant (animation au survol).",
          demoTitle: "Ce que fait le produit (MVP)",
          demoSub:
            "Un écran simple : clients, factures, statuts, relances — et des graphiques comme sur le dashboard (encaissements, répartition). L’IA pour rédiger les relances arrive plus tard.",
          demoBullets: [
            "Fiches client avec montant dû et date d’échéance",
            "Statuts payé / impayé visibles en un coup d’œil",
            "Relances : prévisualisation puis envoi via votre messagerie",
            "Graphiques d’évolution et jauge payé / en attente / retard",
          ],
          faqTitle: "Questions fréquentes",
          faqSub: "Réponses courtes — contactez-nous pour un cas particulier.",
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
          afterTitle: "Après",
          afterBody:
            "Une liste claire, des relances qui partent au bon moment, une idée nette de ce qui rentre.",
          pricingTitle: "Offres",
          pricingSub: "Tarifs indicatifs. Commencez gratuit, passez sur Starter quand ça roule.",
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
            careers: "Carrières",
            contact: "Contact",
            privacy: "Confidentialité",
            terms: "CGU",
          },
          planCtaEnFallback: "S'inscrire",
          demo: {
            panelTitle: "PayPulse · Aperçu",
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
            windowTitle: "PayPulse · Dashboard",
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
          founderRole: "Fondateur, PayPulse",
          installLabels: {
            defaultLabel: "Telecharger PayPulse",
            mobileLabel: "Installer sur mobile",
            macLabel: "Telecharger sur Mac",
            windowsLabel: "Telecharger sur Windows",
            secondaryLabel: "Installer l'application",
          },
          problemTitle: "Le probleme n'est pas vos clients. C'est le timing.",
          problemBody:
            "Les paiements en retard cassent la tresorerie, prennent du temps et ajoutent une charge mentale. PayPulse automatise le suivi sans casser votre relation client.",
          solutionTitle: "Une machine de relance elegante, connectee a votre rythme.",
          solutionBody:
            "Chaque facture est suivie, chaque relance est cadree, chaque encaissement est visible dans un dashboard clair et premium.",
          howTitle: "Comment ca marche",
          howSteps: [
            "Connectez vos clients et factures en quelques minutes.",
            "PayPulse detecte les echeances et prepare les relances.",
            "Vous encaissez plus vite avec un suivi automatique.",
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
          title: "Recover your cash. Automatically.",
          body: "PayPulse follows up with your clients until you get paid.",
          ctaTrial: "Start free",
          ctaDashboard: "Go to dashboard",
          ctaPricing: "See how it works",
          demoAnchor: "demo",
          pricingAnchor: "pricing",
          featuresTitle: "Everything you need to track cash",
          featuresSub: "Six building blocks for independents—from capture to nudges, without spreadsheet chaos.",
          recurringTitle: "Same client, month after month—without re-creating rows",
          recurringBody:
            "Once an invoice is paid, a small U-turn next to the Paid badge creates a new row for the next period (name suffix x2, x3…), unpaid with the new due date, while the previous row stays Paid with its paid-on date. Charts and the Summary report keep one line per period—clear for you and your client.",
          recurringImgAlt:
            "Illustration: invoice card with Paid badge; the U-turn control beside it is an interactive product preview.",
          recurringArrowAria: "Preview: U-turn for the next billing cycle (hover to animate).",
          demoTitle: "What the MVP covers",
          demoSub:
            "One calm screen: clients, invoices, statuses, nudges—and dashboard-style charts (cash-in trend, paid vs pending breakdown). AI-written reminders come later.",
          demoBullets: [
            "Client rows with amount due and due date",
            "Paid vs unpaid status visible at a glance",
            "Reminders: preview then send from your mail client",
            "Evolution chart and paid / pending / overdue donut",
          ],
          faqTitle: "Frequently asked questions",
          faqSub: "Short answers—reach out for edge cases.",
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
              a: "The screenshot on the site is a demo (sample numbers) of the “full” dashboard. In the app, the Free plan shows the key totals but not the evolution chart or the paid/pending donut—those unlock from Starter upward (see plans).",
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
          afterTitle: "After",
          afterBody: "A short list, reminders that fire on time, a clearer sense of what hits your account.",
          pricingTitle: "Plans",
          pricingSub: "Indicative pricing. Start free; move to Starter when volume picks up.",
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
            careers: "Careers",
            contact: "Contact",
            privacy: "Privacy",
            terms: "Terms",
          },
          planCtaEnFallback: "Get started",
          demo: {
            panelTitle: "PayPulse · Preview",
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
            windowTitle: "PayPulse · Dashboard",
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
          founderRole: "Founder, PayPulse",
          installLabels: {
            defaultLabel: "Download PayPulse",
            mobileLabel: "Install on mobile",
            macLabel: "Download for Mac",
            windowsLabel: "Download for Windows",
            secondaryLabel: "Install the app",
          },
          problemTitle: "The problem is not your clients. It's timing.",
          problemBody:
            "Late payments hurt cash flow, waste time, and create friction. PayPulse automates follow-up without hurting client relationships.",
          solutionTitle: "A polished reminder engine built for speed.",
          solutionBody:
            "Every invoice is tracked, every follow-up stays consistent, and every payment is visible in one clean dashboard.",
          howTitle: "How it works",
          howSteps: [
            "Connect your clients and invoices in minutes.",
            "PayPulse detects due dates and prepares reminders.",
            "Get paid faster with automatic follow-up.",
          ],
          finalCtaTitle: "Stop chasing your money",
          finalCtaButton: "Start free",
          features: [
            { kind: "clients" as const, title: "Clients & invoices", body: "Centralize cases, amounts, and due dates without scattered spreadsheets." },
            { kind: "status" as const, title: "Paid / unpaid", body: "Each row shows a clear status so you know who to nudge first." },
            { kind: "remind" as const, title: "Email nudges", body: "Ready-to-send drafts, manual send in the MVP; automatic nudges ship on Pro and up." },
            { kind: "dash" as const, title: "Dashboard", body: "Outstanding, cash-in this month, average delay—cash health at a glance." },
            { kind: "auto" as const, title: "Automation", body: "In-product nudges by due date; on Agency, a second workspace for another brand or business line." },
            { kind: "data" as const, title: "Data you control", body: "Local mode or Supabase—you choose where the database lives." },
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
        ? "border-[#3DFF8A]/50 bg-[#0a1f35]/90 shadow-xl shadow-[#3DFF8A]/14 hover:border-[#3DFF8A]/65 hover:shadow-[0_20px_48px_-12px_rgba(61,255,138,0.18),0_0_40px_-8px_rgba(139,92,246,0.12)]"
        : "border-white/10 bg-[#0a1628]/75 hover:border-white/20 hover:shadow-[0_18px_40px_-14px_rgba(0,0,0,0.45),0_0_32px_-10px_rgba(139,92,246,0.1)]"
    }`;

  return (
    <div className="relative min-h-screen overflow-x-hidden antialiased text-white" style={{ backgroundColor: BG }}>
      <div className="pp-landing-ambient" aria-hidden>
        <LandingStarfield />
        <div
          className="pp-landing-ambient__blob left-[-20%] top-[-25%] h-[min(520px,55vw)] w-[min(520px,55vw)]"
          style={{ background: "radial-gradient(circle, rgba(61,255,138,0.32) 0%, rgba(61,255,138,0.08) 42%, transparent 72%)" }}
        />
        <div
          className="pp-landing-ambient__blob pp-landing-ambient__blob--2 right-[-15%] bottom-[10%] h-[min(480px,50vw)] w-[min(480px,50vw)]"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.26) 0%, rgba(167,139,250,0.1) 45%, transparent 74%)" }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <main className="relative z-[1]">
        <section className="relative overflow-hidden px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:pb-28">
          <HeroWingAurora />
          <div
            className="pointer-events-none absolute inset-0 z-[1] opacity-90"
            style={{
              background:
                "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(61,255,138,0.1), transparent)",
            }}
          />
          <div className="relative z-10 mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
            <div className="min-w-0 max-w-full">
              <MotionKicker
                text={t.product}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3DFF8A]"
              />
              <div className="relative mt-6 pb-5 sm:pb-7">
                <HeroHeadlineGlow />
                {locale === "fr" ? (
                  <h1 className="relative z-10 max-w-xl text-balance text-4xl font-bold tracking-tight text-white hyphens-none sm:text-5xl lg:text-[3.1rem] lg:leading-[1.12]">
                    Recuperez votre argent.
                    <span className="block bg-gradient-to-r from-violet-200 via-fuchsia-200 to-violet-400 bg-clip-text text-transparent [text-shadow:0_0_28px_rgba(168,85,247,0.45)]">
                      Automatiquement.
                    </span>
                  </h1>
                ) : (
                  <MotionHeroTitle
                    title={t.title}
                    className="relative z-10 max-w-xl text-balance text-4xl font-bold tracking-tight text-white hyphens-none sm:text-5xl lg:text-[3.1rem] lg:leading-[1.12]"
                  />
                )}
              </div>
              <Reveal className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300" delay={0.06}>
                {t.body}
              </Reveal>
              <Reveal className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center" delay={0.12}>
                <motion.div
                  className="inline-flex w-full sm:w-auto"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 420, damping: 22 }}
                >
                  <Link
                    href={isAuthenticated ? "/dashboard" : "/signup"}
                    className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-[#3DFF8A] to-[#5cff9e] px-8 py-3.5 text-sm font-semibold text-[#041018] shadow-[0_12px_40px_rgba(61,255,138,0.28),0_0_0_1px_rgba(255,255,255,0.12)] transition hover:shadow-[0_16px_48px_rgba(61,255,138,0.38),0_0_32px_rgba(139,92,246,0.15)] sm:w-auto"
                  >
                    {isAuthenticated ? t.ctaDashboard : t.ctaTrial}
                  </Link>
                </motion.div>
                <motion.div
                  className="inline-flex w-full sm:w-auto"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                >
                  <a
                    href={`#${t.pricingAnchor}`}
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/20 bg-white/[0.06] px-8 py-3.5 text-sm font-semibold text-white shadow-inner shadow-white/[0.03] backdrop-blur-sm transition hover:border-violet-400/35 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(139,92,246,0.12)] sm:w-auto"
                  >
                    {t.ctaPricing}
                  </a>
                </motion.div>
              </Reveal>
              <PwaInstallButton labels={t.installLabels} />
              <FounderTrust kicker={t.founderKicker} role={t.founderRole} />
            </div>
            <motion.div
              className="relative min-w-0"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={
                reduceMotion
                  ? undefined
                  : {
                      rotateX: 2,
                      rotateY: -2,
                      scale: 1.01,
                      transition: { type: "spring", stiffness: 260, damping: 22 },
                    }
              }
              style={{ perspective: 1200 }}
            >
              <SoftFloat>
                <motion.div
                  className="relative mx-auto w-full max-w-[520px] [transform-style:preserve-3d]"
                  whileHover={{
                    filter: "drop-shadow(0 28px 56px rgba(0,0,0,0.55)) drop-shadow(0 12px 36px rgba(139,92,246,0.12))",
                  }}
                >
                  <div className="pointer-events-none absolute inset-0 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_45%_35%,rgba(139,92,246,0.48),rgba(139,92,246,0.16)_38%,transparent_68%)] blur-3xl" />
                  <div className="pointer-events-none absolute -inset-x-4 bottom-6 -z-10 h-20 rounded-full bg-violet-500/35 blur-2xl" />
                  <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.03] p-4 shadow-[0_30px_90px_-24px_rgba(0,0,0,0.72),0_0_90px_-36px_rgba(139,92,246,0.62)] backdrop-blur-xl">
                    <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(255,255,255,0.08),transparent_38%,rgba(139,92,246,0.2))]" />
                    <div className="relative aspect-[4/5] w-full">
                      <Image
                        src={FOUNDER_IMAGE_SRC}
                        alt={FOUNDER_NAME}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 1024px) 90vw, 42vw"
                        unoptimized
                      />
                    </div>
                  </div>
                </motion.div>
              </SoftFloat>
            </motion.div>
          </div>
        </section>

        <section id="features" className="scroll-mt-28 border-t border-white/10 bg-[#06101f] px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{t.featuresTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-3 max-w-2xl text-center text-slate-400" delay={0.06}>
              <p>{t.featuresSub}</p>
            </Reveal>
            <motion.div
              className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-48px" }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.09, delayChildren: 0.06 } },
              }}
            >
              {featureCards.map((card) => (
                <motion.div
                  key={card.title}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } },
                  }}
                  className="rounded-2xl border border-white/10 bg-[#071528]/80 p-6 shadow-lg shadow-black/25 backdrop-blur-md"
                  whileHover={{
                    y: -4,
                    borderColor: "rgba(167, 139, 250, 0.22)",
                    boxShadow:
                      "0 22px 48px -14px rgba(0,0,0,0.48), 0 0 0 1px rgba(255,255,255,0.06), 0 0 44px -8px rgba(139, 92, 246, 0.14)",
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                >
                  <div className="flex items-start gap-4">
                    <div className="relative rounded-xl border border-white/10 bg-white/[0.05] p-3 shadow-[0_0_24px_-4px_rgba(139,92,246,0.2)]">
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{card.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.body}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id="recurring-cycle" className="scroll-mt-28 border-t border-white/10 bg-[#071528] px-4 py-16 sm:px-6">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <Reveal className="flex min-w-0 flex-col justify-center lg:py-2">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{t.recurringTitle}</h2>
              <p className="mt-5 text-sm leading-relaxed text-slate-400 sm:text-base">{t.recurringBody}</p>
            </Reveal>
            <Reveal className="relative min-w-0 w-full" delay={0.08}>
              {/* Ratio 1200×680 : pleine largeur de colonne, hauteur dérivée — image en fill + object-cover */}
              <div className="relative aspect-[1200/680] w-full overflow-hidden rounded-2xl shadow-[0_24px_56px_-12px_rgba(0,0,0,0.45),0_0_40px_-8px_rgba(139,92,246,0.1)] ring-1 ring-white/10">
                <Image
                  src={RECURRING_CYCLE_IMAGE_SRC}
                  alt={t.recurringImgAlt}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  unoptimized
                />
                <RecurringCycleArrowDecor ariaLabel={t.recurringArrowAria} />
              </div>
            </Reveal>
          </div>
        </section>

        <section id={t.demoAnchor} className="scroll-mt-28 border-t border-white/10 bg-[#071528] px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{t.demoTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-3 max-w-2xl text-center text-slate-400" delay={0.05}>
              <p>{t.demoSub}</p>
            </Reveal>
            <div className="mt-14 grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
              <motion.ul
                className="space-y-4 text-left"
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
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
                    className="flex gap-3 text-sm leading-relaxed text-slate-300"
                  >
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3DFF8A]/15 text-xs font-bold text-[#3DFF8A] shadow-[0_0_16px_rgba(61,255,138,0.12)]" aria-hidden>
                      ✓
                    </span>
                    <span>{line}</span>
                  </motion.li>
                ))}
              </motion.ul>
              <div className="flex min-w-0 justify-center lg:justify-end">
                <motion.div
                  className="w-full max-w-xl lg:max-w-[min(100%,520px)]"
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.62, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={
                    reduceMotion
                      ? undefined
                      : {
                          rotateX: 2.5,
                          rotateY: 2,
                          scale: 1.01,
                          transition: { type: "spring", stiffness: 280, damping: 22 },
                        }
                  }
                  style={{ perspective: 1400 }}
                >
                  <SoftFloatDashboard>
                    <motion.div className="[transform-style:preserve-3d]">
                      <DashboardChartsMock
                        charts={t.chartsMock}
                        className="origin-top scale-[0.94] sm:scale-[0.97] lg:max-w-none"
                      />
                    </motion.div>
                  </SoftFloatDashboard>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#07070a] px-4 py-16 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
            <Reveal className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 shadow-[0_20px_56px_-18px_rgba(0,0,0,0.6)] backdrop-blur-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-200/80">Probleme</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{t.problemTitle}</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{t.problemBody}</p>
            </Reveal>
            <Reveal
              className="rounded-2xl border border-violet-300/20 bg-[linear-gradient(160deg,rgba(139,92,246,0.16),rgba(17,24,39,0.78))] p-7 shadow-[0_22px_64px_-20px_rgba(139,92,246,0.5)] backdrop-blur-xl"
              delay={0.07}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-100/90">Solution</p>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{t.solutionTitle}</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-200">{t.solutionBody}</p>
            </Reveal>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#050505] px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{t.howTitle}</h2>
            </Reveal>
            <motion.div
              className="mt-10 grid gap-4 sm:grid-cols-3"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
            >
              {t.howSteps.map((step, idx) => (
                <motion.div
                  key={step}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                  }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-lg"
                  whileHover={{
                    y: -4,
                    borderColor: "rgba(167,139,250,0.34)",
                    boxShadow: "0 18px 42px -16px rgba(139,92,246,0.42)",
                  }}
                >
                  <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-violet-300/25 bg-violet-500/15 text-sm font-bold text-violet-100">
                    {idx + 1}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">{step}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section id={t.pricingAnchor} className="scroll-mt-28 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <Reveal className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white">{t.pricingTitle}</h2>
              <p className="mt-4 text-slate-400">{t.pricingSub}</p>
            </Reveal>
            <motion.div
              className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-32px" }}
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.1, delayChildren: 0.08 } },
              }}
            >
              {MARKETING_PLANS.map((plan) => {
                const localized = locale === "fr" ? PLAN_FR[plan.id] : null;
                const name = localized?.name ?? plan.name;
                const description = localized?.description ?? plan.description;
                const features = localized?.features ?? plan.features;
                const period =
                  localized?.periodLabel ?? (plan.period === "forever" ? (locale === "fr" ? "gratuit" : "free") : plan.period);
                const cta = localized?.cta ?? (plan.id === "free" ? (locale === "fr" ? "Tester gratuitement" : "Start free") : t.planCtaEnFallback);
                const highlight = Boolean(plan.highlighted);

                return (
                  <motion.div
                    key={plan.id}
                    className={planCardClass(highlight)}
                    variants={{
                      hidden: { opacity: 0, y: 22 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] } },
                    }}
                    whileHover={{
                      y: -4,
                      transition: { type: "spring", stiffness: 400, damping: 24 },
                    }}
                  >
                    {highlight ? (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#3DFF8A] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#041018]">
                        {t.popular}
                      </span>
                    ) : null}
                    <h3 className="text-lg font-bold text-white">{name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{description}</p>
                    <p className="mt-6 flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight text-white">{plan.price}</span>
                      <span className="text-sm text-slate-500">{period}</span>
                    </p>
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
                        href={isAuthenticated ? `/dashboard?plan=${plan.id}` : `/signup?plan=${plan.id}`}
                        className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                          highlight
                            ? "bg-gradient-to-r from-[#3DFF8A] to-[#5cff9e] text-[#041018] shadow-[0_8px_28px_rgba(61,255,138,0.25)] hover:shadow-[0_12px_36px_rgba(61,255,138,0.32)]"
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
        </section>

        <section id="faq" className="scroll-mt-28 border-t border-white/10 bg-[#06101f] px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <Reveal className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{t.faqTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-3 max-w-xl text-center text-slate-400" delay={0.05}>
              <p>{t.faqSub}</p>
            </Reveal>
            <motion.div
              className="mt-12 space-y-3"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-24px" }}
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
                  <summary className="flex list-none items-center justify-between gap-3 py-3 text-sm font-semibold text-white outline-none ring-offset-2 ring-offset-[#06101f] focus-visible:ring-2 focus-visible:ring-[#3DFF8A]/70 [&::-webkit-details-marker]:hidden">
                    <span>{item.q}</span>
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-400 transition group-open:rotate-45 group-open:border-[#3DFF8A]/40 group-open:text-[#3DFF8A]"
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

        <section className="border-t border-white/10 bg-[#071528] px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <Reveal className="text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Persona</p>
              <h2 className="mt-3 text-xl font-bold text-white sm:text-2xl">{t.personaTitle}</h2>
            </Reveal>
            <Reveal className="mx-auto mt-6 max-w-2xl" delay={0.06}>
              <blockquote className="border-l-2 border-[#3DFF8A]/60 pl-5 text-left text-base italic leading-relaxed text-slate-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]">
                {t.personaQuote}
              </blockquote>
            </Reveal>
            <motion.div
              className="mt-12 grid gap-6 sm:grid-cols-2"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
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
                className="rounded-2xl border border-white/10 bg-[#06101f]/85 p-6 shadow-lg shadow-black/25 backdrop-blur-md"
                whileHover={{
                  y: -4,
                  borderColor: "rgba(255,255,255,0.16)",
                  boxShadow: "0 20px 44px -12px rgba(0,0,0,0.45), 0 0 36px -10px rgba(139,92,246,0.1)",
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t.beforeTitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">{t.beforeBody}</p>
              </motion.div>
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
                }}
                className="rounded-2xl border border-[#3DFF8A]/25 bg-[#0a1f35]/90 p-6 shadow-[0_16px_40px_-12px_rgba(61,255,138,0.12)] backdrop-blur-md"
                whileHover={{
                  y: -4,
                  borderColor: "rgba(61,255,138,0.45)",
                  boxShadow: "0 22px 48px -10px rgba(61,255,138,0.15), 0 0 40px -8px rgba(139,92,246,0.12)",
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: ACCENT }}>
                  {t.afterTitle}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-200">{t.afterBody}</p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="border-t border-white/10 bg-[#050505] px-4 py-18 sm:px-6">
          <Reveal className="mx-auto flex max-w-4xl flex-col items-center rounded-3xl border border-violet-300/20 bg-[linear-gradient(180deg,rgba(139,92,246,0.14),rgba(5,5,5,0.82))] px-6 py-12 text-center shadow-[0_22px_72px_-24px_rgba(139,92,246,0.5)] backdrop-blur-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{t.finalCtaTitle}</h2>
            <motion.div className="mt-8" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Link
                href={isAuthenticated ? "/dashboard" : "/signup"}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-300 via-fuchsia-300 to-violet-500 px-8 py-3.5 text-sm font-semibold text-[#0f0620] shadow-[0_14px_42px_rgba(139,92,246,0.45)]"
              >
                {t.finalCtaButton}
              </Link>
            </motion.div>
          </Reveal>
        </section>

        <footer className="border-t border-white/10 px-4 py-12 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <PayPulseLogo className="h-9 w-9 shrink-0 text-[#3DFF8A]" />
              <span className="font-semibold text-white">PayPulse</span>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
              <div>
                <p className="font-semibold text-slate-400">{t.footerProduct}</p>
                <ul className="mt-3 space-y-2 text-slate-500">
                  <li>
                    <a href="#features" className="transition hover:text-[#3DFF8A]">
                      {t.footerLinks.features}
                    </a>
                  </li>
                  <li>
                    <a href={`#${t.demoAnchor}`} className="transition hover:text-[#3DFF8A]">
                      {t.footerLinks.preview}
                    </a>
                  </li>
                  <li>
                    <a href={`#${t.pricingAnchor}`} className="transition hover:text-[#3DFF8A]">
                      {t.footerLinks.pricing}
                    </a>
                  </li>
                  <li>
                    <a href="#faq" className="transition hover:text-[#3DFF8A]">
                      {t.footerLinks.faq}
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-400">{t.footerCompany}</p>
                <ul className="mt-3 space-y-2 text-slate-500">
                  <li>
                    <span className="cursor-default">{t.footerLinks.about}</span>
                  </li>
                  <li>
                    <span className="cursor-default">{t.footerLinks.careers}</span>
                  </li>
                  <li>
                    <span className="cursor-default">{t.footerLinks.contact}</span>
                  </li>
                </ul>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="font-semibold text-slate-400">{t.footerLegal}</p>
                <ul className="mt-3 space-y-2 text-slate-500">
                  <li>
                    <Link href="/confidentialite" className="transition hover:text-[#3DFF8A]">
                      {t.footerLinks.privacy}
                    </Link>
                  </li>
                  <li>
                    <Link href="/conditions-utilisation" className="transition hover:text-[#3DFF8A]">
                      {t.footerLinks.terms}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <p className="mx-auto mt-10 max-w-6xl text-center text-xs text-slate-600">
            © {new Date().getFullYear()} PayPulse
          </p>
        </footer>
      </main>
    </div>
  );
}
