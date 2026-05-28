export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type PwaInstallOutcome = "accepted" | "dismissed" | "unavailable";

export type InstallGuidePlatform = "ios" | "android" | "edge" | "chrome" | "other";

export function detectInstallGuidePlatform(): InstallGuidePlatform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  if (/edg\//.test(ua)) return "edge";
  if (/chrome\//.test(ua) && !/edg\//.test(ua)) return "chrome";
  return "other";
}

export function isPwaInstalled() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function isFinePointerDevice() {
  if (typeof window === "undefined") return true;
  try {
    return window.matchMedia("(pointer: fine)").matches;
  } catch {
    return true;
  }
}
