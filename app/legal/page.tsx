import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

export const metadata: Metadata = {
  title: "Informations légales | PayPulss",
  description: "Index des pages légales PayPulss : confidentialité, CGU, sécurité, mentions légales.",
};

const links = [
  {
    href: "/mentions-legales",
    title: "Mentions légales",
    desc: "Éditeur (Alkarizmia, Belgique), hébergeur, immatriculation BCE/KBO, contact.",
  },
  {
    href: "/confidentialite",
    title: "Politique de confidentialité",
    desc: "Données personnelles, finalités, sous-traitants, droits RGPD.",
  },
  {
    href: "/conditions-utilisation",
    title: "Conditions générales d'utilisation",
    desc: "Objet du service, compte, usage acceptable, responsabilité, droit applicable.",
  },
  {
    href: "/droits-securite-donnees",
    title: "Sécurité des données",
    desc: "Authentification, isolation (RLS), signalement de vulnérabilités.",
  },
] as const;

export default function LegalPage() {
  const e = LEGAL_ENTITY;
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Informations légales</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        <strong>{e.productBrand}</strong> est un logiciel en ligne de suivi de factures et de relances pour freelances
        et indépendants, édité par <strong>{e.denomination}</strong> ({e.kbo}, Belgique). Les documents ci-dessous
        encadrent l&apos;usage du service.
      </p>
      <p className="mt-2 text-sm text-slate-500">Dernière mise à jour de cette page index : 9 mai 2026.</p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-800">
        <p className="font-semibold text-slate-900">Éditeur</p>
        <p className="mt-2">
          {e.denomination}, BCE/KBO {e.kbo}
        </p>
        <p className="mt-1">{e.address}</p>
        <p className="mt-2">
          Contact :{" "}
          <a href={`mailto:${e.contactEmail}?subject=Contact%20${e.productBrand}`} className="text-blue-700 underline hover:text-blue-600">
            {e.contactEmail}
          </a>
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Marque / service : {e.productBrand} ({e.denomination})
        </p>
      </div>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2">
        {links.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              <span className="mt-4 inline-block text-sm font-medium text-blue-700">Lire la page →</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
