import Link from "next/link";

const KBO = "1037.806.166";
const YEAR = new Date().getFullYear();

const footerLinkClass = "text-slate-600 transition hover:text-slate-900";

type FooterColumn = {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
};

const columns: FooterColumn[] = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "/#features" },
      { label: "Aperçu", href: "/#demo" },
      { label: "Tarifs", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      { label: "À propos", href: "/a-propos" },
      { label: "Le produit en images", href: "/#product-tour" },
      { label: "Comment ça marche", href: "/#how" },
    ],
  },
  {
    title: "Société",
    links: [
      { label: "Fondateur", href: "/a-propos" },
      { label: "Contact", href: "/contact" },
      { label: "Écrire par e-mail", href: "mailto:contact@paypulss.com?subject=Contact%20PayPulss", external: true },
    ],
  },
  {
    title: "Mentions",
    links: [
      { label: "Informations légales", href: "/legal" },
      { label: "Mentions légales", href: "/mentions-legales" },
      { label: "Sécurité des données", href: "/droits-securite-donnees" },
      { label: "Confidentialité", href: "/confidentialite" },
      { label: "CGU", href: "/conditions-utilisation" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-50 px-4 py-12 text-sm text-slate-600 sm:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <nav aria-label="Pied de page" className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-14">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((item) => (
                  <li key={item.label}>
                    {item.external ? (
                      <a href={item.href} className={footerLinkClass}>
                        {item.label}
                      </a>
                    ) : (
                      <Link href={item.href} className={footerLinkClass}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
                {col.title === "Société" ? (
                  <li>
                    <span className="text-slate-400" title="Page dédiée à venir">
                      Carrières <span className="sr-only">(bientôt disponible)</span>
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-12 border-t border-slate-200 pt-8">
          <p className="text-center text-xs leading-relaxed text-slate-500 sm:text-left">
            © {YEAR} Alkarizmia, entreprise enregistrée sous le numéro {KBO} (BCE/KBO).
          </p>
          <p className="mt-2 text-center text-xs text-slate-500 sm:text-left">
            PayPulss est une marque et un service proposé par Alkarizmia.
          </p>
        </div>
      </div>
    </footer>
  );
}
