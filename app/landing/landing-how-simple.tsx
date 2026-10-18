import { PaypulssPulseDivider } from "@/app/landing/paypulss-pulse";

const STEPS = [
  {
    n: "1",
    title: "Ajoutez vos clients et factures",
    body: "Nom, montant, échéance. Tout tient dans une liste claire, pas dans cinq tableurs.",
  },
  {
    n: "2",
    title: "Voyez qui doit payer",
    body: "Statuts lisibles : en attente, relancé, payé. Vous savez quoi faire ce matin.",
  },
  {
    n: "3",
    title: "Relancez en deux clics",
    body: "Ouvrez un message prêt à envoyer depuis votre messagerie. Simple, pro, sans stress.",
  },
] as const;

/** Section « Comment ça marche » en 3 étapes, sans motion lourde. */
export function LandingHowSimple() {
  return (
    <section id="how" className="scroll-mt-28 px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold tracking-[-0.03em] text-text sm:text-4xl">
          Comment ça marche
        </h2>
        <p className="mt-3 text-text-muted">Trois étapes. Pas de jargon.</p>
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
