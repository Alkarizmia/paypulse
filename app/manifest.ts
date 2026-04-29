import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PayPulse",
    short_name: "PayPulse",
    description: "PayPulse relance vos clients a votre place jusqu'au paiement.",
    start_url: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    icons: [
      {
        src: "/icons/pwa-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/pwa-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
