import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  // #region agent log
  fetch("http://127.0.0.1:7871/ingest/cb3f8ae5-32b3-49c0-a8e1-26632907cf73", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a2d099" },
    body: JSON.stringify({
      sessionId: "a2d099",
      runId: "pre-fix",
      hypothesisId: "H1",
      location: "app/manifest.ts:4",
      message: "manifest() invoked",
      data: { route: "/manifest.webmanifest" },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  const icons: NonNullable<MetadataRoute.Manifest["icons"]> = [
    {
      src: "/branding/paypulse-logo-192.png",
      sizes: "192x192",
      type: "image/png",
      purpose: "maskable",
    },
    {
      src: "/branding/paypulse-logo-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ];

  // #region agent log
  fetch("http://127.0.0.1:7871/ingest/cb3f8ae5-32b3-49c0-a8e1-26632907cf73", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "a2d099" },
    body: JSON.stringify({
      sessionId: "a2d099",
      runId: "pre-fix",
      hypothesisId: "H2",
      location: "app/manifest.ts:28",
      message: "manifest icons payload",
      data: {
        icons,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  return {
    name: "PayPulse",
    short_name: "PayPulse",
    description: "PayPulse relance vos clients a votre place jusqu'au paiement.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    icons,
  };
}
