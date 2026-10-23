import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "Contact | PayPulss",
  description: "Contact the PayPulss team for sales, support, or legal questions.",
  alternates: { canonical: getSiteUrl() + "/contact" },
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Contact</h1>
        <p className="mt-3 text-slate-600">
          For sales, support, or legal questions related to PayPulss, contact us by email.
        </p>

        <p className="mt-8 text-sm font-medium text-slate-800 sm:text-base">
          Main email:{" "}
          <a
            href="mailto:contact@paypulss.com?subject=Contact%20PayPulss"
            className="text-blue-700 underline underline-offset-2 hover:text-blue-800"
          >
            contact@paypulss.com
          </a>
        </p>

        <a
          href="mailto:contact@paypulss.com?subject=Contact%20PayPulss"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Contact us
        </a>
      </section>
    </main>
  );
}
