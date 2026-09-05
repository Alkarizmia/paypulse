"use client";

import dynamic from "next/dynamic";
import { LandingPageSkeleton } from "@/app/landing/landing-page-skeleton";
import "./landing-premium.css";

const LandingPage = dynamic(
  () => import("@/app/landing/landing-page").then((mod) => ({ default: mod.LandingPage })),
  {
    ssr: false,
    loading: () => <LandingPageSkeleton />,
  },
);

export function LandingPageDynamic() {
  return <LandingPage />;
}
