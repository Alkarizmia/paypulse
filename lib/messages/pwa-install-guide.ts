import type { AppLocale } from "@/lib/app-locale";
import type { InstallGuidePlatform } from "@/lib/pwa-install";

const GUIDES: Record<AppLocale, Record<InstallGuidePlatform, readonly string[]>> = {
  fr: {
    ios: [
      "Ouvrez paypulss.com dans Safari (pas dans Chrome ni une autre app).",
      "Appuyez sur Partager (icone carre avec fleche).",
      "Choisissez Sur l'ecran d'accueil, puis Ajouter.",
    ],
    android: [
      "Dans Chrome, ouvrez le menu (trois points en haut a droite).",
      "Choisissez Installer l'application ou Ajouter a l'ecran d'accueil.",
      "Validez pour lancer PayPulss comme une app.",
    ],
    edge: [
      "Cliquez sur le menu ... en haut a droite de Edge.",
      "Applications > Installer ce site en tant qu'application.",
      "Confirmez l'installation de PayPulss.",
      "Vous pouvez aussi cliquer sur l'icone Installer dans la barre d'adresse.",
    ],
    chrome: [
      "Cliquez sur le menu ... en haut a droite de Chrome.",
      "Choisissez Installer PayPulss (ou Transmettre, puis Installer).",
      "Validez dans la fenetre de confirmation.",
      "Si une icone Installer apparait dans la barre d'adresse, cliquez dessus.",
    ],
    other: [
      "Dans le menu du navigateur, cherchez Installer PayPulss ou Ajouter a l'ecran d'accueil.",
      "Sur Windows, Chrome ou Edge proposent souvent l'installation en un clic.",
    ],
  },
  en: {
    ios: [
      "Open paypulss.com in Safari (not Chrome or another in-app browser).",
      "Tap Share (square icon with arrow).",
      "Choose Add to Home Screen, then Add.",
    ],
    android: [
      "In Chrome, open the menu (three dots, top right).",
      "Tap Install app or Add to Home screen.",
      "Confirm to launch PayPulss like an app.",
    ],
    edge: [
      "Click the ... menu at the top right in Edge.",
      "Apps > Install this site as an app.",
      "Confirm installing PayPulss.",
      "You can also use the Install icon in the address bar if shown.",
    ],
    chrome: [
      "Click the ... menu at the top right in Chrome.",
      "Choose Install PayPulss (or Cast, then Install).",
      "Confirm in the dialog.",
      "If an Install icon appears in the address bar, click it directly.",
    ],
    other: [
      "In your browser menu, look for Install PayPulss or Add to Home screen.",
      "On Windows, Chrome or Edge often offer one-click install when eligible.",
    ],
  },
  nl: {
    ios: [
      "Open paypulss.com in Safari (niet in Chrome of een andere app).",
      "Tik op Delen (vierkant met pijl).",
      "Kies Zet op beginscherm, daarna Voeg toe.",
    ],
    android: [
      "Open in Chrome het menu (drie puntjes rechtsboven).",
      "Kies App installeren of Toevoegen aan startscherm.",
      "Bevestig om PayPulss als app te openen.",
    ],
    edge: [
      "Klik op het menu ... rechtsboven in Edge.",
      "Apps > Deze site installeren als app.",
      "Bevestig de installatie van PayPulss.",
      "U kunt ook op het pictogram Installeren in de adresbalk klikken.",
    ],
    chrome: [
      "Klik op het menu ... rechtsboven in Chrome.",
      "Kies PayPulss installeren.",
      "Bevestig in het dialoogvenster.",
      "Als er een Installeren-pictogram in de adresbalk staat, klik daarop.",
    ],
    other: [
      "Zoek in het browsermenu naar PayPulss installeren of Toevoegen aan startscherm.",
      "Op Windows bieden Chrome of Edge vaak installatie in een klik aan.",
    ],
  },
  es: {
    ios: [
      "Abre paypulss.com en Safari (no en Chrome ni otro navegador embebido).",
      "Pulsa Compartir (icono cuadrado con flecha).",
      "Elige Anadir a pantalla de inicio y confirma.",
    ],
    android: [
      "En Chrome, abre el menu (tres puntos arriba a la derecha).",
      "Elige Instalar aplicacion o Anadir a pantalla de inicio.",
      "Confirma para abrir PayPulss como app.",
    ],
    edge: [
      "Haz clic en el menu ... arriba a la derecha en Edge.",
      "Aplicaciones > Instalar este sitio como aplicacion.",
      "Confirma la instalacion de PayPulss.",
      "Tambien puedes usar el icono Instalar en la barra de direcciones.",
    ],
    chrome: [
      "Haz clic en el menu ... arriba a la derecha en Chrome.",
      "Elige Instalar PayPulss.",
      "Confirma en el dialogo.",
      "Si aparece el icono Instalar en la barra de direcciones, pulsalo.",
    ],
    other: [
      "En el menu del navegador, busca Instalar PayPulss o Anadir a pantalla de inicio.",
      "En Windows, Chrome o Edge suelen ofrecer instalacion en un clic.",
    ],
  },
};

export function getPwaInstallGuideSteps(locale: AppLocale, platform: InstallGuidePlatform) {
  return GUIDES[locale][platform];
}
