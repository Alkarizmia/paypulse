import type { AppLocale } from "@/lib/app-locale";

const fr = {
  sectionAria: "Aperçu PayPulss au défilement",
  scene2Title: "Interface pensée pour l'encaissement",
  scene2Sub: "Statuts lisibles, relances calées sur l'échéance, tableau de bord aéré.",
  tryFreeCta: "Essayez Paypulss Gratuitement",
  mockRows: [
    { name: "Studio Mirabelle", amount: "1 890 €", status: "En attente" },
    { name: "Atelier Nord", amount: "640 €", status: "Relancé" },
    { name: "Lefèvre & Co", amount: "2 100 €", status: "Payé" },
  ] as const,
  faceAlts: [
    "Portrait illustratif d'une utilisatrice",
    "Portrait illustratif d'un utilisateur",
    "Portrait illustratif d'une utilisatrice",
    "Portrait illustratif d'un utilisateur",
  ] as const,
} as const;

const en = {
  sectionAria: "PayPulss scroll preview",
  scene2Title: "Built for getting paid",
  scene2Sub: "Readable statuses, due-date nudges, a breathable dashboard.",
  tryFreeCta: "Try PayPulss for free",
  mockRows: [
    { name: "Studio Mirabelle", amount: "1,890 €", status: "Pending" },
    { name: "Atelier Nord", amount: "640 €", status: "Nudged" },
    { name: "Lefèvre & Co", amount: "2,100 €", status: "Paid" },
  ] as const,
  faceAlts: [
    "Illustrative portrait of a user",
    "Illustrative portrait of a user",
    "Illustrative portrait of a user",
    "Illustrative portrait of a user",
  ] as const,
} as const;

const nl = {
  sectionAria: "PayPulss-scrollvoorbeeld",
  scene2Title: "Gemaakt om betaald te worden",
  scene2Sub: "Leesbare statussen, herinneringen op de vervaldatum, een rustig dashboard.",
  tryFreeCta: "Probeer PayPulss gratis",
  mockRows: [
    { name: "Studio Mirabelle", amount: "1.890 €", status: "In afwachting" },
    { name: "Atelier Nord", amount: "640 €", status: "Herinnerd" },
    { name: "Lefèvre & Co", amount: "2.100 €", status: "Betaald" },
  ] as const,
  faceAlts: [
    "Illustratief portret van een gebruiker",
    "Illustratief portret van een gebruiker",
    "Illustratief portret van een gebruiker",
    "Illustratief portret van een gebruiker",
  ] as const,
} as const;

const es = {
  sectionAria: "Vista previa al desplazarse",
  scene2Title: "Hecho para que te paguen",
  scene2Sub: "Estados claros, recordatorios alineados con el vencimiento, un panel ligero.",
  tryFreeCta: "Prueba PayPulss gratis",
  mockRows: [
    { name: "Studio Mirabelle", amount: "1.890 €", status: "Pendiente" },
    { name: "Atelier Nord", amount: "640 €", status: "Recordado" },
    { name: "Lefèvre & Co", amount: "2.100 €", status: "Pagado" },
  ] as const,
  faceAlts: [
    "Retrato ilustrativo de una usuaria",
    "Retrato ilustrativo de un usuario",
    "Retrato ilustrativo de una usuaria",
    "Retrato ilustrativo de un usuario",
  ] as const,
} as const;

const PACKS = { fr, en, nl, es } as const;

export type ScrollPinCopy = (typeof PACKS)["fr"];

export const HERO_FACE_SRCS = [
  "/landing/hero-face-1.png",
  "/landing/hero-face-2.png",
  "/landing/hero-face-3.png",
  "/landing/hero-face-4.png",
] as const;

export function getScrollPinCopy(locale: AppLocale): ScrollPinCopy {
  return PACKS[locale] as ScrollPinCopy;
}
