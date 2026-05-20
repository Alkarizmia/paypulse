import type { AppLocale } from "@/lib/app-locale";

const fr = {
  kicker: "Faites défiler",
  scene1Title: "Interface pensée pour l’encaissement",
  scene1Sub:
    "Statuts lisibles, relances calées sur l’échéance, tableau de bord aéré, sans surcharge visuelle.",
  chip1: "Échéances visibles",
  chip2: "Relances cadrées",
  chip3: "Cash lisible",
  arrowHint: "La suite du site est en dessous.",
  sectionAria: "Aperçu PayPulss",
  faceAlts: ["Avatar illustratif A", "Avatar illustratif B", "Avatar illustratif C", "Avatar illustratif D"] as const,
} as const;

const en = {
  kicker: "Keep scrolling",
  scene1Title: "Built for getting paid",
  scene1Sub: "Readable statuses, due-date nudges, a breathable dashboard, without visual noise.",
  chip1: "Due dates at a glance",
  chip2: "Nudges on schedule",
  chip3: "Cash in view",
  arrowHint: "The rest of the site is below.",
  sectionAria: "PayPulss preview",
  faceAlts: ["Illustrative avatar A", "Illustrative avatar B", "Illustrative avatar C", "Illustrative avatar D"] as const,
} as const;

const nl = {
  kicker: "Blijf scrollen",
  scene1Title: "Gemaakt om betaald te worden",
  scene1Sub:
    "Leesbare statussen, herinneringen op de vervaldatum, een rustig dashboard, zonder visuele ruis.",
  chip1: "Vervaldagen in één oogopslag",
  chip2: "Herinneringen op tijd",
  chip3: "Cashflow in zicht",
  arrowHint: "De rest van de site staat hieronder.",
  sectionAria: "PayPulss-voorbeeld",
  faceAlts: ["Illustratieve avatar A", "Illustratieve avatar B", "Illustratieve avatar C", "Illustratieve avatar D"] as const,
} as const;

const es = {
  kicker: "Sigue desplazándote",
  scene1Title: "Hecho para que te paguen",
  scene1Sub:
    "Estados claros, recordatorios alineados con el vencimiento, un panel ligero, sin ruido visual.",
  chip1: "Vencimientos de un vistazo",
  chip2: "Recordatorios a tiempo",
  chip3: "Cobros a la vista",
  arrowHint: "El resto del sitio está debajo.",
  sectionAria: "Vista previa de PayPulss",
  faceAlts: ["Avatar ilustrativo A", "Avatar ilustrativo B", "Avatar ilustrativo C", "Avatar ilustrativo D"] as const,
} as const;

const PACKS = { fr, en, nl, es } as const;

export type ScrollPinCopy = (typeof PACKS)["fr"];

export function getScrollPinCopy(locale: AppLocale): ScrollPinCopy {
  return PACKS[locale] as ScrollPinCopy;
}
