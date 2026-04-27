import type { Metadata } from "next";
import { TrashView } from "./trash-view";

export const metadata: Metadata = {
  title: "Corbeille | PayPulse",
  description: "Factures supprimées — restaurer ou effacer définitivement.",
};

export default function CorbeillePage() {
  return <TrashView />;
}
