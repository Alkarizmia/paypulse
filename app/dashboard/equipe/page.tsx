import type { Metadata } from "next";
import { EquipeView } from "./equipe-view";

export const metadata: Metadata = {
  title: "Équipe | PayPulss",
  description: "Invitations et rôles des collaborateurs (Pro et Agency).",
};

export default function EquipePage() {
  return <EquipeView />;
}
