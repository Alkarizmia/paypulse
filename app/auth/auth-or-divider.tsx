type AuthOrDividerProps = {
  label: string;
};

export function AuthOrDivider({ label }: AuthOrDividerProps) {
  return (
    <div className="relative py-1" role="separator" aria-label={label}>
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-slate-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white/90 px-3 text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      </div>
    </div>
  );
}
