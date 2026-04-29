"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type InstallLabels = {
  defaultLabel: string;
  mobileLabel: string;
  macLabel: string;
  windowsLabel: string;
  secondaryLabel: string;
};

function platformLabel(labels: InstallLabels) {
  if (typeof navigator === "undefined") return labels.defaultLabel;
  const ua = navigator.userAgent.toLowerCase();
  if (/android|iphone|ipad|ipod|mobile/.test(ua)) return labels.mobileLabel;
  if (/mac/.test(ua)) return labels.macLabel;
  if (/win/.test(ua)) return labels.windowsLabel;
  return labels.defaultLabel;
}

export function PwaInstallButton({ labels }: { labels: InstallLabels }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [hint, setHint] = useState<string>("");
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(display-mode: standalone)").matches;
  });
  const ctaLabel = useMemo(() => platformLabel(labels), [labels]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (isInstalled) return null;

  const install = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setHint("Sur iPhone/iPad: Safari > Partager > Sur l'ecran d'accueil.");
      return;
    }
    if (/android/.test(ua)) {
      setHint("Sur Android: menu du navigateur > Installer l'application.");
      return;
    }
    setHint("Dans votre navigateur: menu en haut a droite > Installer PayPulse.");
  };

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center justify-center rounded-full border border-violet-300/45 bg-violet-500/15 px-6 py-3 text-sm font-semibold text-violet-50 backdrop-blur-sm transition hover:scale-[1.01] hover:border-violet-300/70 hover:shadow-[0_0_28px_rgba(139,92,246,0.25)]"
      >
        {ctaLabel}
      </button>
      <span className="text-xs text-slate-300">{hint || labels.secondaryLabel}</span>
    </div>
  );
}
