import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
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
