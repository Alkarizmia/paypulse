"use client";

import dynamic from "next/dynamic";
import { LandingPageSkeleton } from "@/app/landing/landing-page-skeleton";
import "./landing-premium.css";

/**
 * Charge la landing en client pour la modale waitlist / auth context,
 * mais avec SSR activé (H1 et copy présents dans le HTML initial).
 */
const LandingPage = dynamic(
  () => import("@/app/landing/landing-page").then((mod) => ({ default: mod.LandingPage })),
  {
    loading: () => <LandingPageSkeleton />,
  },
);

export function LandingPageDynamic() {
  return <LandingPage />;
}
