/** Logo vectoriel, fond transparent — s’adapte au thème clair / sombre (currentColor). */
export function PayPulseLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 20h7l3.5-11 4.5 22 3.5-11h9.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="34" cy="20" r="3" fill="currentColor" />
    </svg>
  );
}
