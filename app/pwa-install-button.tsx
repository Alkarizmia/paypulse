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

function installHintForPlatform(appName: string) {
  if (typeof navigator === "undefined") return "";
  const ua = navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isAndroid = /android/.test(ua);
  const isEdge = /edg\//.test(ua);
  const isChrome = /chrome\//.test(ua) && !isEdge;
  const isSafari = /safari/.test(ua) && !/chrome|chromium|crios|edg\//.test(ua);

  if (isIos) {
    if (!isSafari) return "Sur iPhone/iPad, ouvrez le site dans Safari puis Partager > Sur l'ecran d'accueil.";
    return "Sur iPhone/iPad: Safari > Partager > Sur l'ecran d'accueil.";
  }
  if (isAndroid) return "Sur Android: menu du navigateur > Installer l'application.";
  if (isEdge) return `Sur Edge (PC): menu ... > Applications > Installer ce site en tant qu'application (${appName}).`;
  if (isChrome) return `Sur Chrome (PC): menu ... > Installer ${appName} (ou icone Installer dans la barre d'adresse).`;
  return `Dans votre navigateur (PC): menu en haut a droite > Installer ${appName}.`;
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
    setHint(installHintForPlatform("PayPulss"));
  };

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center justify-center rounded-full border border-violet-200 bg-violet-50 px-6 py-3 text-sm font-semibold text-violet-700 backdrop-blur-sm transition hover:scale-[1.01] hover:border-violet-300 hover:bg-violet-100 hover:shadow-[0_0_28px_rgba(139,92,246,0.18)]"
      >
        {ctaLabel}
      </button>
      <span className="text-xs text-slate-600">{hint || labels.secondaryLabel}</span>
    </div>
  );
}
