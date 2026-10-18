/**
 * Maquette Free (HTML/CSS/SVG) : liste clients + totaux, sans graphiques Starter+.
 * Lisible en capture mobile / Shorts.
 */
const ROWS = [
  {
    name: "Studio Lumen",
    amount: "1 200 €",
    detail: "12 jours de retard",
    status: "wait" as const,
    statusLabel: "En attente",
  },
  {
    name: "Atelier Nord",
    amount: "480 €",
    detail: "Relance envoyée",
    status: "remind" as const,
    statusLabel: "Relancé",
  },
  {
    name: "Marc D.",
    amount: "900 €",
    detail: "Réglé aujourd'hui",
    status: "paid" as const,
    statusLabel: "Payé",
  },
];

export function LandingFreeMock() {
  return (
    <div className="pp-free-mock" id="apercu">
      <div className="pp-free-mock-chrome">
        <span className="pp-free-mock-dot" />
        <span className="pp-free-mock-dot" />
        <span className="pp-free-mock-dot" />
        <span className="pp-free-mock-title">PayPulss · Accueil</span>
      </div>

      <div className="pp-free-mock-body">
        <div className="pp-free-mock-total">
          <p className="pp-free-mock-total-label">À récupérer</p>
          <p className="pp-free-mock-total-value">1 680 €</p>
          <p className="pp-free-mock-total-hint">2 dossiers ouverts</p>
        </div>

        <ul className="pp-free-mock-list">
          {ROWS.map((row) => (
            <li key={row.name} className="pp-free-mock-row">
              <div className="pp-free-mock-row-main">
                <span className="pp-free-mock-name">{row.name}</span>
                <span className="pp-free-mock-amount">{row.amount}</span>
              </div>
              <div className="pp-free-mock-row-meta">
                <span className="pp-free-mock-detail">{row.detail}</span>
                <span className={`pp-free-mock-badge pp-free-mock-badge--${row.status}`}>
                  {row.statusLabel}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <p className="pp-free-mock-foot">Totaux et liste de dossiers, sans tableur.</p>
      </div>
    </div>
  );
}
