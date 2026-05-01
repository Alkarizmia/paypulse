import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-50 px-4 py-10 text-sm text-slate-600 sm:px-6">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Mentions légales</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Éditeur, hébergeur et contact : page à compléter avec vos informations [SOCIÉTÉ], [RCS], etc.
          </p>
        </section>
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">Confidentialité</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Politique RGPD : données collectées, finalités, sous-traitants (Supabase, hébergeur, Stripe et e-mail lorsque
            branchés), droits des personnes.
          </p>
        </section>
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900">CGU & sécurité</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Conditions d&apos;utilisation du logiciel et page dédiée aux mesures de sécurité (auth, RLS, signalement).
          </p>
        </section>
      </div>
      <div className="mx-auto mt-6 flex w-full max-w-7xl flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row">
        <p>© PayPulss</p>
        <nav className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/legal" className="transition hover:text-slate-800">
            Informations légales
          </Link>
          <Link href="/mentions-legales" className="transition hover:text-slate-800">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="transition hover:text-slate-800">
            Confidentialité
          </Link>
          <Link href="/conditions-utilisation" className="transition hover:text-slate-800">
            CGU
          </Link>
          <Link href="/droits-securite-donnees" className="transition hover:text-slate-800">
            Sécurité
          </Link>
        </nav>
      </div>
    </footer>
  );
}
