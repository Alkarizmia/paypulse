import type { Metadata } from "next";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

export const metadata: Metadata = {
  title: "À propos | PayPulss",
  description: "Informations de contact et de responsabilité pour PayPulss (Alkarizmia).",
};

export default function AProposPage() {
  const e = LEGAL_ENTITY;
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">À propos</h1>
        <p className="mt-3 text-slate-600">
          <strong>{e.productBrand}</strong> est un SaaS de suivi de factures et de relances, proposé par{" "}
          <strong>{e.denomination}</strong> (Belgique). Cette page présente les informations publiques disponibles à date.
        </p>
        <dl className="mt-8 space-y-4 text-sm sm:text-base">
          <div>
            <dt className="font-semibold text-slate-900">Dénomination</dt>
            <dd className="text-slate-700">{e.denomination}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Numéro d&apos;entreprise (BCE/KBO)</dt>
            <dd className="text-slate-700">{e.kbo}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Domiciliation professionnelle</dt>
            <dd className="text-slate-700">{e.address}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Fondateur</dt>
            <dd className="text-slate-700">{e.founder}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Responsable légale</dt>
            <dd className="text-slate-700">{e.publicationDirector}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Contact</dt>
            <dd>
              <a
                href={`mailto:${e.contactEmail}?subject=Contact%20${e.productBrand}`}
                className="text-blue-700 underline underline-offset-2 hover:text-blue-800"
              >
                {e.contactEmail}
              </a>
            </dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
