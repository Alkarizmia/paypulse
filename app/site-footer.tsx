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
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Preview", href: "/#demo" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
      { label: "About", href: "/a-propos" },
      { label: "Product tour", href: "/#product-tour" },
      { label: "How it works", href: "/#how" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Founder", href: "/a-propos" },
      { label: "Contact", href: "/contact" },
      { label: "Email us", href: "mailto:contact@paypulss.com?subject=Contact%20PayPulss", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Legal information", href: "/legal" },
      { label: "Legal notice", href: "/mentions-legales" },
      { label: "Data security", href: "/droits-securite-donnees" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms of use", href: "/terms" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-slate-50 px-4 py-12 text-sm text-slate-600 sm:px-6">
      <div className="mx-auto w-full max-w-7xl">
        <nav aria-label="Footer" className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-14">
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
                {col.title === "Company" ? (
                  <li>
                    <span className="text-slate-400" title="Page coming soon">
                      Careers <span className="sr-only">(coming soon)</span>
                    </span>
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-12 border-t border-slate-200 pt-8">
          <p className="text-center text-xs leading-relaxed text-slate-500 sm:text-left">
            © {YEAR} Alkarizmia, company registered under number {KBO} (BCE/KBO).
          </p>
          <p className="mt-2 text-center text-xs text-slate-500 sm:text-left">
            PayPulss is a brand and service offered by Alkarizmia.
          </p>
        </div>
      </div>
    </footer>
  );
}
