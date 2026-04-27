import type { Metadata } from "next";
import { BilanView } from "./bilan-view";

export const metadata: Metadata = {
  title: "Bilan | PayPulse",
  description: "Bilan des factures sur 7, 30, 90 jours ou 1 an.",
};

export default function BilanPage() {
  return <BilanView />;
}
