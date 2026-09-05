/** Official PayPulss mark (transparent PNG). */
export function PayPulseLogo({ className }: { className?: string }) {
  return (
    <img
      src="/branding/paypulss-official-mark.png?v=3"
      alt="PayPulss"
      className={["w-auto shrink-0 object-contain object-center", className].filter(Boolean).join(" ")}
    />
  );
}
