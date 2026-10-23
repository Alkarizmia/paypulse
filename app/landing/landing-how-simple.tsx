import { PaypulssPulseDivider } from "@/app/landing/paypulss-pulse";

const STEPS = [
  {
    n: "1",
    title: "Add your clients and invoices",
    body: "Name, amount, due date. Everything lives in one clear list, not five spreadsheets.",
  },
  {
    n: "2",
    title: "See who still owes you",
    body: "Readable statuses: pending, followed up, paid. You know what to do this morning.",
  },
  {
    n: "3",
    title: "Follow up in two clicks",
    body: "Open a ready-to-send message in your mail app. Simple, professional, low stress.",
  },
] as const;

/** How it works: three steps, no heavy motion. */
export function LandingHowSimple() {
  return (
    <section id="how" className="scroll-mt-28 px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-text sm:text-4xl">
          How it works
        </h2>
        <PaypulssPulseDivider className="mx-auto mt-8" />
      </div>

      <ol className="mx-auto mt-12 grid max-w-5xl gap-8 sm:grid-cols-3 sm:gap-6">
        {STEPS.map((step) => (
          <li key={step.n} className="text-left sm:text-center">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
              {step.n}
            </span>
            <h3 className="mt-4 text-lg font-semibold tracking-tight text-text">{step.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
