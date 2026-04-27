import type { Metadata } from "next";
import { ReminderTemplatesView } from "./reminder-templates-view";

export const metadata: Metadata = {
  title: "Modèles de relance | PayPulse",
  description: "Personnalisez vos brouillons et modèles d’e-mails de relance (Pro / Agence).",
};

export default function ModelesRelancePage() {
  return <ReminderTemplatesView />;
}
