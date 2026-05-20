import type { AppLocale } from "@/lib/app-locale";

const fr = {
  features: "Fonctionnalités",
  preview: "Aperçu",
  pricing: "Tarifs",
  faq: "FAQ",
  cta: "Essai gratuit",
  dashboard: "Dashboard",
  settings: "Paramètres",
  login: "Connexion",
  logout: "Déconnexion",
  goDashboard: "Aller au dashboard",
  marketingHome: "Accueil",
  aboutNav: "À propos",
  contactNav: "Contact",
  legalNav: "Légal",
  menuOpen: "Ouvrir le menu",
  menuClose: "Fermer le menu",
  menuSheetTitle: "Navigation",
  menuAccountSection: "Compte",
  menuLangSection: "Langue",
  freeTierHint: "Plan gratuit : 3 clients · 5 factures · aucune carte.",
} as const;

const en = {
  features: "Features",
  preview: "Preview",
  pricing: "Pricing",
  faq: "FAQ",
  cta: "Try free",
  dashboard: "Dashboard",
  settings: "Settings",
  login: "Login",
  logout: "Logout",
  goDashboard: "Go to dashboard",
  marketingHome: "Home",
  aboutNav: "About",
  contactNav: "Contact",
  legalNav: "Legal",
  menuOpen: "Open menu",
  menuClose: "Close menu",
  menuSheetTitle: "Navigation",
  menuAccountSection: "Account",
  menuLangSection: "Language",
  freeTierHint: "Free tier: 3 clients · 5 invoices · no card.",
} as const;

const nl = {
  features: "Functies",
  preview: "Voorbeeld",
  pricing: "Prijzen",
  faq: "Vragen",
  cta: "Probeer gratis",
  dashboard: "Overzicht",
  settings: "Instellingen",
  login: "Inloggen",
  logout: "Afmelden",
  goDashboard: "Naar dashboard",
  marketingHome: "Home",
  aboutNav: "Over ons",
  contactNav: "Contact",
  legalNav: "Juridisch",
  menuOpen: "Menu openen",
  menuClose: "Menu sluiten",
  menuSheetTitle: "Navigatie",
  menuAccountSection: "Account",
  menuLangSection: "Taal",
  freeTierHint: "Gratis plan: 3 klanten · 5 facturen · geen kaart.",
} as const;

const es = {
  features: "Funciones",
  preview: "Vista previa",
  pricing: "Precios",
  faq: "Preguntas",
  cta: "Probar gratis",
  dashboard: "Panel",
  settings: "Ajustes",
  login: "Entrar",
  logout: "Cerrar sesión",
  goDashboard: "Ir al panel",
  marketingHome: "Inicio",
  aboutNav: "Sobre nosotros",
  contactNav: "Contacto",
  legalNav: "Legal",
  menuOpen: "Abrir menú",
  menuClose: "Cerrar menú",
  menuSheetTitle: "Navegación",
  menuAccountSection: "Cuenta",
  menuLangSection: "Idioma",
  freeTierHint: "Plan gratuito: 3 clientes · 5 facturas · sin tarjeta.",
} as const;

const PACKS = { fr, en, nl, es } as const;

export type GlobalTopBarCopy = (typeof PACKS)["fr"];

export function getGlobalTopBarCopy(locale: AppLocale): GlobalTopBarCopy {
  return PACKS[locale] as GlobalTopBarCopy;
}
