import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos | PayPulss",
  description: "Informations de contact et de responsabilité pour PayPulss.",
};

export default function AProposPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">À propos</h1>
        <p className="mt-3 text-slate-600">
          PayPulss est un SaaS de suivi de factures et de relances. Cette page présente les informations publiques
          disponibles à date.
        </p>
        <dl className="mt-8 space-y-4 text-sm sm:text-base">
          <div>
            <dt className="font-semibold text-slate-900">Fondateur</dt>
            <dd className="text-slate-700">El Fahmi Bilal</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Responsable légale</dt>
            <dd className="text-slate-700">Ikram El Fahmi</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-900">Contact</dt>
            <dd>
              <a
                href="mailto:contact@paypulss.com?subject=Contact%20Paypulss"
                className="text-blue-700 underline underline-offset-2 hover:text-blue-800"
              >
                contact@paypulss.com
              </a>
            </dd>
          </div>
        </dl>
        <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Le nom juridique final de la société sera renseigné après l&apos;immatriculation.
        </p>
      </section>
    </main>
  );
}
