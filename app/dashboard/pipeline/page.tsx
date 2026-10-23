import type { Metadata } from "next";
import { PipelineView } from "./pipeline-view";

export const metadata: Metadata = {
  title: "Collections Pipeline | PayPulss",
  description: "Track invoices from reminder to payment in your PayPulss pipeline.",
};

export default function PipelinePage() {
  return <PipelineView />;
}
