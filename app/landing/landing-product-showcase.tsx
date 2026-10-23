import { LandingFreeMock } from "@/app/landing/landing-free-mock";

/** Hero mock (no charts / framer). English + USD only. */
export function LandingProductShowcase() {
  return (
    <div className="relative z-[1] px-4 sm:px-6">
      <div className="mx-auto max-w-lg sm:max-w-xl">
        <LandingFreeMock />
      </div>
    </div>
  );
}
