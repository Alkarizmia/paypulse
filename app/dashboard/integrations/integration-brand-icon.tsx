type Props = { className?: string };

/** Logo simplifié Google Calendar. */
export function IntegrationBrandIcon({ className = "h-10 w-10" }: Props) {
  const base = `${className} shrink-0`;
  return (
    <svg className={base} viewBox="0 0 40 40" aria-hidden>
      <rect width="40" height="40" rx="8" fill="#fff" stroke="#dadce0" />
      <rect x="8" y="10" width="24" height="6" fill="#1a73e8" rx="1" />
      <text x="20" y="30" textAnchor="middle" fill="#1a73e8" fontSize="16" fontWeight="700" fontFamily="system-ui,sans-serif">
        31
      </text>
    </svg>
  );
}
