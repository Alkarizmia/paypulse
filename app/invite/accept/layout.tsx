import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Team Invite | PayPulss",
  description: "Accept a PayPulss team invitation.",
  robots: { index: false, follow: false },
};

export default function InviteAcceptLayout({ children }: { children: ReactNode }) {
  return children;
}
