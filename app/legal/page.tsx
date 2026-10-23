import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_ENTITY } from "@/lib/legal-entity";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Legal Information | PayPulss",
  description: "PayPulss legal pages index: privacy, terms, security, legal notice.",
  alternates: { canonical: getSiteUrl() + "/legal" },
};

const links = [
  {
    href: "/mentions-legales",
    title: "Legal Notice",
    desc: "Publisher (Alkarizmia, Belgium), host, BCE/KBO registration, contact.",
  },
  {
    href: "/privacy",
    title: "Privacy Policy",
    desc: "Personal data, purposes, processors, GDPR rights.",
  },
  {
    href: "/terms",
    title: "Terms of Use",
    desc: "Service purpose, account, acceptable use, liability, governing law.",
  },
  {
    href: "/droits-securite-donnees",
    title: "Data Security",
    desc: "Authentication, isolation (RLS), vulnerability reporting.",
  },
] as const;

export default function LegalPage() {
  const e = LEGAL_ENTITY;
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Legal information</h1>
      <p className="mt-3 max-w-3xl text-slate-600">
        <strong>{e.productBrand}</strong> is online software for invoice tracking and payment reminders for
        freelancers and independents, published by <strong>{e.denomination}</strong> ({e.kbo}, Belgium). The
        documents below frame use of the service.
      </p>
      <p className="mt-2 text-sm text-slate-500">Last update of this index page: May 9, 2026.</p>
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/90 p-4 text-sm text-slate-800">
        <p className="font-semibold text-slate-900">Publisher</p>
        <p className="mt-2">
          {e.denomination}, BCE/KBO {e.kbo}
        </p>
        <p className="mt-1">{e.address}</p>
        <p className="mt-2">
          Contact:{" "}
          <a href={`mailto:${e.contactEmail}?subject=Contact%20${e.productBrand}`} className="text-blue-700 underline hover:text-blue-600">
            {e.contactEmail}
          </a>
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Brand / service: {e.productBrand} ({e.denomination})
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
              <span className="mt-4 inline-block text-sm font-medium text-blue-700">Read the page →</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
