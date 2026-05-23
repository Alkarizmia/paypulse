import type { Client } from "@/app/dashboard/types";

function iso(y: number, m: number, d: number): string {
  return new Date(y, m, d, 12, 0, 0, 0).toISOString();
}

/** Format attendu par ClientList / métriques : AAAA-MM-JJ (pas ISO complet). */
function ymd(y: number, m: number, d: number): string {
  const month = String(m + 1).padStart(2, "0");
  const day = String(d).padStart(2, "0");
  return `${y}-${month}-${day}`;
}

/** Données fictives pour l’aperçu landing (graphiques alignés sur le dashboard réel). */
export const LANDING_DEMO_CLIENTS: Client[] = [
  {
    id: "land-1",
    name: "Studio North",
    email: "studio@demo.paypulss",
    amountDue: 2_400,
    dueDate: ymd(2026, 4, 28),
    status: "unpaid",
    createdAt: iso(2026, 0, 5),
  },
  {
    id: "land-2",
    name: "Belair SRL",
    email: "belair@demo.paypulss",
    amountDue: 2_100,
    dueDate: ymd(2026, 2, 10),
    status: "unpaid",
    createdAt: iso(2026, 0, 12),
  },
  {
    id: "land-3",
    name: "Agence Lefèvre",
    email: "lef@demo.paypulss",
    amountDue: 3_920,
    dueDate: ymd(2026, 5, 15),
    status: "unpaid",
    createdAt: iso(2026, 1, 3),
  },
  {
    id: "land-4",
    name: "Mirabelle Design",
    email: "mir@demo.paypulss",
    amountDue: 1_890,
    dueDate: ymd(2026, 4, 5),
    status: "paid",
    paidAt: iso(2026, 4, 8),
    paidEvents: [{ at: iso(2026, 4, 8), amount: 1_890 }],
    createdAt: iso(2025, 10, 1),
  },
  {
    id: "land-5",
    name: "Atelier Vert",
    email: "vert@demo.paypulss",
    amountDue: 1_290,
    dueDate: ymd(2026, 5, 1),
    status: "paid",
    paidAt: iso(2026, 4, 22),
    paidEvents: [
      { at: iso(2025, 11, 12), amount: 980 },
      { at: iso(2025, 12, 8), amount: 1_100 },
      { at: iso(2026, 0, 14), amount: 1_050 },
      { at: iso(2026, 1, 18), amount: 1_200 },
      { at: iso(2026, 2, 9), amount: 1_350 },
      { at: iso(2026, 3, 20), amount: 2_800 },
      { at: iso(2026, 4, 22), amount: 1_290 },
    ],
    createdAt: iso(2025, 8, 1),
  },
  {
    id: "land-6",
    name: "Collectif Wave",
    email: "wave@demo.paypulss",
    amountDue: 860,
    dueDate: ymd(2026, 3, 1),
    status: "paid",
    paidAt: iso(2026, 2, 28),
    paidEvents: [
      { at: iso(2026, 1, 5), amount: 720 },
      { at: iso(2026, 2, 28), amount: 860 },
    ],
    createdAt: iso(2026, 0, 20),
  },
];
