/** Ligne « pouls » : En attente → Relancé → Payé. Accent signature PayPulss. */
export function PaypulssPulse({
  className = "",
  labels = true,
}: {
  className?: string;
  labels?: boolean;
}) {
  return (
    <div className={`pp-pulse ${className}`} role="img" aria-label="En attente, Relancé, Payé">
      <svg className="pp-pulse-svg" viewBox="0 0 320 28" fill="none" aria-hidden>
        <path
          className="pp-pulse-line"
          d="M2 14 H72 L88 6 L104 22 L120 10 L136 14 H218 L234 6 L250 22 L266 14 H318"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="40" cy="14" r="4" className="pp-pulse-dot pp-pulse-dot--wait" />
        <circle cx="160" cy="14" r="4" className="pp-pulse-dot pp-pulse-dot--remind" />
        <circle cx="280" cy="14" r="4" className="pp-pulse-dot pp-pulse-dot--paid" />
      </svg>
      {labels ? (
        <div className="pp-pulse-labels">
          <span className="pp-pulse-label pp-pulse-label--wait">En attente</span>
          <span className="pp-pulse-label pp-pulse-label--remind">Relancé</span>
          <span className="pp-pulse-label pp-pulse-label--paid">Payé</span>
        </div>
      ) : null}
    </div>
  );
}

/** Séparateur horizontal discret (même signature). */
export function PaypulssPulseDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`pp-pulse-divider ${className}`} aria-hidden>
      <svg viewBox="0 0 240 12" fill="none" className="pp-pulse-divider-svg">
        <path
          d="M2 6 H70 L82 2 L94 10 L106 4 L118 6 H238"
          className="pp-pulse-line"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
