import type { Metadata } from "next";
import type { ReactNode } from "react";
import { WorkspaceProvider } from "@/app/workspace-context";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}
