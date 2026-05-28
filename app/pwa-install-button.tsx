"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/app/locale-context";
import { usePwaInstall } from "@/app/pwa-install-provider";
import { detectInstallGuidePlatform, isFinePointerDevice } from "@/lib/pwa-install";
import { getPwaInstallGuideSteps } from "@/lib/messages/pwa-install-guide";

type InstallLabels = {
  defaultLabel: string;
  mobileLabel: string;
  macLabel: string;
  windowsLabel: string;
  secondaryLabel: string;
  guideTitle: string;
  guideClose: string;
  guideNativeReady: string;
};

function platformLabel(labels: InstallLabels) {
  if (typeof navigator === "undefined") return labels.defaultLabel;
  const ua = navigator.userAgent.toLowerCase();
  if (/android|iphone|ipad|ipod|mobile/.test(ua)) return labels.mobileLabel;
  if (/mac/.test(ua)) return labels.macLabel;
  if (/win/.test(ua)) return labels.windowsLabel;
  return labels.defaultLabel;
}

function InstallGuideDialog({
  labels,
  steps,
  onClose,
}: {
  labels: InstallLabels;
  steps: readonly string[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-guide-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        aria-label={labels.guideClose}
        onClick={onClose}
      />
      <div className="relative z-[1] w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <h3 id="pwa-install-guide-title" className="text-lg font-semibold text-slate-900">
          {labels.guideTitle}
        </h3>
        <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-slate-600">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="pp-hero-cta mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {labels.guideClose}
        </button>
      </div>
    </div>
  );
}

export function PwaInstallButton({ labels }: { labels: InstallLabels }) {
  const { locale } = useLocale();
  const { canNativePrompt, isInstalled, promptInstall } = usePwaInstall();
  const [ctaLabel, setCtaLabel] = useState(labels.defaultLabel);
  const [mounted, setMounted] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStepsList, setGuideStepsList] = useState<readonly string[]>([]);

  useEffect(() => {
    setMounted(true);
    setCtaLabel(platformLabel(labels));
  }, [labels]);

  if (!mounted || isInstalled) return null;

  const install = async () => {
    if (canNativePrompt) {
      const outcome = await promptInstall();
      if (outcome === "accepted") return;
      if (outcome === "dismissed") return;
    }

    const platform = detectInstallGuidePlatform();
    setGuideStepsList(getPwaInstallGuideSteps(locale, platform));
    setGuideOpen(true);
  };

  const showNativeHint = canNativePrompt && isFinePointerDevice();

  return (
    <>
      <div className="relative z-30 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => void install()}
          className="pp-hero-cta inline-flex items-center justify-center rounded-full border border-violet-200 bg-violet-50 px-6 py-3 text-sm font-semibold text-violet-700 backdrop-blur-sm hover:border-violet-300 hover:bg-violet-100 hover:shadow-[0_0_28px_rgba(139,92,246,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
        >
          {ctaLabel}
        </button>
        <button
          type="button"
          onClick={() => void install()}
          className="pp-hero-cta text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
        >
          {labels.secondaryLabel}
        </button>
        {showNativeHint ? (
          <p className="w-full basis-full text-center text-xs text-violet-600/90" role="status">
            {labels.guideNativeReady}
          </p>
        ) : null}
      </div>
      {guideOpen ? (
        <InstallGuideDialog labels={labels} steps={guideStepsList} onClose={() => setGuideOpen(false)} />
      ) : null}
    </>
  );
}
