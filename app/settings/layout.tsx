import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WorkspaceProvider } from "@/app/workspace-context";

export const metadata: Metadata = {
  title: "Settings | PayPulss",
  description: "Manage your PayPulss account, language, and preferences.",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
