import type { Metadata } from "next";
import { PipelineView } from "./pipeline-view";

export const metadata: Metadata = {
  title: "Pipeline encaissement | PayPulss",
  description: "Suivez vos dossiers de la relance au paiement.",
};

export default function PipelinePage() {
  return <PipelineView />;
}
