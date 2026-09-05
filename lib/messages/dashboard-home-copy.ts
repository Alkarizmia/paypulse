import type { AppLocale } from "@/lib/app-locale";
import { pickQuad } from "@/lib/messages/pick";

export type DashboardHomeCopy = {
  homeGreeting: string;
  newClient: string;
  sendReminder: string;
  kpiUnpaid: string;
  kpiReceivedMonth: string;
  kpiAvgDelay: string;
  kpiRemindersSent: string;
  kpiNoHistory: string;
  kpiEmptyCta: string;
  kpiEmptyReminders: string;
  foldersHintTitle: string;
  foldersHintCta: string;
  foldersHintClose: string;
  kpiDays: string;
  integrationsTitle: string;
  calendarBannerConnected: string;
  calendarBannerConnect: string;
  pipelineTitle: string;
  pipelineHint: string;
  pipelineConfigure: string;
  pipelinePageTitle: string;
  pipelinePageIntro: string;
  pipelineViewAll: string;
  pipelineOpenFull: string;
  pipelineBackHome: string;
  pipelineAddClient: string;
  colToRemind: string;
  colReminderSent: string;
  colPromised: string;
  colPaid: string;
  colEmpty: string;
  priorityTitle: string;
  priorityEmpty: string;
  priorityClient: string;
  priorityAmount: string;
  priorityDue: string;
  priorityLast: string;
  priorityAction: string;
  priorityRemind: string;
  priorityNever: string;
  priorityYesterday: string;
  onboardingTitle: string;
  onboardingOrg: string;
  onboardingGmail: string;
  onboardingClient: string;
  onboardingReminder: string;
  onboardingAuto: string;
  onboardingCtaOrg: string;
  onboardingCtaIntegrations: string;
  onboardingCtaAdd: string;
  onboardingCtaRelances: string;
  onboardingDismiss: string;
  onboardingShowAgain: string;
  integrationsPageTitle: string;
  integrationsPageIntro: string;
  integrationsCalendarTitle: string;
  integrationsCalendarBody: string;
  calendarConnect: string;
  calendarDisconnect: string;
  calendarSyncNow: string;
  calendarSyncing: string;
  calendarStatusConnected: string;
  calendarStatusNotConnected: string;
  calendarUnavailable: string;
  calendarConnectedToast: string;
  calendarConnectFailed: string;
  calendarSyncSuccess: string;
  calendarSyncFailed: string;
  calendarLastSync: string;
  workspaceNav: string;
  navHome: string;
  navClients: string;
  navPipeline: string;
  navRelances: string;
  navTreasury: string;
  navOrganization: string;
  asideLabel: string;
  asideOrgTitle: string;
  asideOrgOpen: string;
  asideOrgEmpty: string;
  asideShortcutsTitle: string;
  navIntegrations: string;
  navTeam: string;
  searchPlaceholder: string;
};

export function getDashboardHomeCopy(locale: AppLocale): DashboardHomeCopy {
  return pickQuad(locale, {
    fr: {
      homeGreeting: "Bonjour",
      newClient: "Nouveau client",
      sendReminder: "Relance",
      kpiUnpaid: "Impayés",
      kpiReceivedMonth: "Encaissé ce mois",
      kpiAvgDelay: "Délai moyen",
      kpiRemindersSent: "Relances envoyées",
      kpiNoHistory: "Pas encore de données",
      kpiEmptyCta: "Ajoute ton premier client pour voir tes stats ici",
      kpiEmptyReminders: "Envoie une première relance pour suivre tes envois ici",
      foldersHintTitle: "Nouveau : Dossiers",
      foldersHintCta: "Découvrir",
      foldersHintClose: "Fermer",
      kpiDays: "jours",
      integrationsTitle: "Intégrations",
      calendarBannerConnected: "Google Calendar connecté",
      calendarBannerConnect: "Connecter Google Calendar",
      pipelineTitle: "Pipeline encaissement",
      pipelineHint: "Suivi des dossiers : à relancer, relance envoyée, échéance à venir, payé.",
      pipelineConfigure: "Voir les clients",
      pipelinePageTitle: "Pipeline encaissement",
      pipelinePageIntro:
        "Suivez chaque dossier de la relance au paiement. Cliquez sur une carte pour envoyer une relance ou ouvrir la fiche.",
      pipelineViewAll: "Voir tout le pipeline",
      pipelineOpenFull: "Ouvrir le pipeline",
      pipelineBackHome: "Retour à l'accueil",
      pipelineAddClient: "Ajouter un client",
      colToRemind: "À relancer",
      colReminderSent: "Relance envoyée",
      colPromised: "Échéance à venir",
      colPaid: "Payé",
      colEmpty: "Aucun dossier",
      priorityTitle: "À relancer en priorité",
      priorityEmpty: "Aucun impayé en retard pour le moment.",
      priorityClient: "Client",
      priorityAmount: "Montant",
      priorityDue: "Échéance",
      priorityLast: "Relance",
      priorityAction: "Action",
      priorityRemind: "Relancer",
      priorityNever: "Jamais",
      priorityYesterday: "Récemment",
      onboardingTitle: "Premiers pas",
      onboardingOrg: "Compléter l’organisation (nom, pays)",
      onboardingGmail: "Configurer Google / Gmail",
      onboardingClient: "Ajouter un premier client",
      onboardingReminder: "Envoyer une première relance",
      onboardingAuto: "Activer les relances automatiques",
      onboardingCtaOrg: "Organisation",
      onboardingCtaIntegrations: "Intégrations",
      onboardingCtaAdd: "Ajouter un client",
      onboardingCtaRelances: "Relances",
      onboardingDismiss: "Fermer",
      onboardingShowAgain: "Premiers pas",
      integrationsPageTitle: "Intégrations",
      integrationsPageIntro:
        "Synchronisez vos échéances et relances PayPulss avec Google Calendar pour garder une vue claire sur vos impayés.",
      integrationsCalendarTitle: "Google Calendar",
      integrationsCalendarBody:
        "Les échéances clients, relances envoyées, encaissements et événements perso de l’organisation peuvent apparaître dans votre agenda Google.",
      calendarConnect: "Connecter Google Calendar",
      calendarDisconnect: "Déconnecter",
      calendarSyncNow: "Synchroniser maintenant",
      calendarSyncing: "Synchronisation…",
      calendarStatusConnected: "Connecté",
      calendarStatusNotConnected: "Non connecté",
      calendarUnavailable: "Connexion temporairement indisponible. Réessayez plus tard.",
      calendarConnectedToast: "Google Calendar est connecté.",
      calendarConnectFailed: "Connexion impossible. Réessayez.",
      calendarSyncSuccess: "Synchronisation terminée.",
      calendarSyncFailed: "Synchronisation impossible. Réessayez.",
      calendarLastSync: "Dernière synchro",
      workspaceNav: "Workspace",
      navHome: "Accueil",
      navClients: "Clients",
      navPipeline: "Pipeline",
      navRelances: "Relances",
      navTreasury: "Trésorerie",
      navOrganization: "Organisation",
      asideLabel: "Panneau latéral accueil",
      asideOrgTitle: "Organisation",
      asideOrgOpen: "Ouvrir Organisation",
      asideOrgEmpty: "Nom et pays à compléter dans les paramètres.",
      asideShortcutsTitle: "Raccourcis",
      navIntegrations: "Intégrations",
      navTeam: "Équipe",
      searchPlaceholder: "Rechercher un client…",
    },
    en: {
      homeGreeting: "Hello",
      newClient: "New client",
      sendReminder: "Reminder",
      kpiUnpaid: "Outstanding",
      kpiReceivedMonth: "Collected this month",
      kpiAvgDelay: "Avg. delay",
      kpiRemindersSent: "Reminders sent",
      kpiNoHistory: "No data yet",
      kpiEmptyCta: "Add your first client to see stats here",
      kpiEmptyReminders: "Send a first reminder to track sends here",
      foldersHintTitle: "New: Folders",
      foldersHintCta: "Open",
      foldersHintClose: "Close",
      kpiDays: "days",
      integrationsTitle: "Integrations",
      calendarBannerConnected: "Google Calendar connected",
      calendarBannerConnect: "Connect Google Calendar",
      pipelineTitle: "Collection pipeline",
      pipelineHint: "Track cases: to nudge, reminder sent, upcoming due, paid.",
      pipelineConfigure: "View clients",
      pipelinePageTitle: "Collection pipeline",
      pipelinePageIntro:
        "Track each case from first nudge to payment. Click a card to send a reminder or open the record.",
      pipelineViewAll: "View full pipeline",
      pipelineOpenFull: "Open pipeline",
      pipelineBackHome: "Back to home",
      pipelineAddClient: "Add a client",
      colToRemind: "To nudge",
      colReminderSent: "Reminder sent",
      colPromised: "Upcoming due",
      colPaid: "Paid",
      colEmpty: "No cases",
      priorityTitle: "Priority follow-ups",
      priorityEmpty: "No overdue unpaid cases right now.",
      priorityClient: "Client",
      priorityAmount: "Amount",
      priorityDue: "Due",
      priorityLast: "Reminder",
      priorityAction: "Action",
      priorityRemind: "Send reminder",
      priorityNever: "Never",
      priorityYesterday: "Recently",
      onboardingTitle: "Getting started",
      onboardingOrg: "Complete organization (name, country)",
      onboardingGmail: "Set up Google / Gmail",
      onboardingClient: "Add your first client",
      onboardingReminder: "Send a first reminder",
      onboardingAuto: "Turn on automatic reminders",
      onboardingCtaOrg: "Organization",
      onboardingCtaIntegrations: "Integrations",
      onboardingCtaAdd: "Add a client",
      onboardingCtaRelances: "Reminders",
      onboardingDismiss: "Close",
      onboardingShowAgain: "Getting started",
      integrationsPageTitle: "Integrations",
      integrationsPageIntro:
        "Sync PayPulss due dates and reminders with Google Calendar so nothing slips through the cracks.",
      integrationsCalendarTitle: "Google Calendar",
      integrationsCalendarBody:
        "Client due dates, sent reminders, payments, and personal organization events can show up in your Google calendar.",
      calendarConnect: "Connect Google Calendar",
      calendarDisconnect: "Disconnect",
      calendarSyncNow: "Sync now",
      calendarSyncing: "Syncing…",
      calendarStatusConnected: "Connected",
      calendarStatusNotConnected: "Not connected",
      calendarUnavailable: "Connection is temporarily unavailable. Please try again later.",
      calendarConnectedToast: "Google Calendar is connected.",
      calendarConnectFailed: "Could not connect. Please try again.",
      calendarSyncSuccess: "Sync completed.",
      calendarSyncFailed: "Sync failed. Please try again.",
      calendarLastSync: "Last sync",
      workspaceNav: "Workspace",
      navHome: "Home",
      navClients: "Clients",
      navPipeline: "Pipeline",
      navRelances: "Reminders",
      navTreasury: "Cash",
      navOrganization: "Organization",
      asideLabel: "Home sidebar",
      asideOrgTitle: "Organization",
      asideOrgOpen: "Open organization",
      asideOrgEmpty: "Add name and country in settings.",
      asideShortcutsTitle: "Shortcuts",
      navIntegrations: "Integrations",
      navTeam: "Team",
      searchPlaceholder: "Search a client…",
    },
    nl: {
      homeGreeting: "Hallo",
      newClient: "Nieuwe klant",
      sendReminder: "Herinnering",
      kpiUnpaid: "Openstaand",
      kpiReceivedMonth: "Ontvangen deze maand",
      kpiAvgDelay: "Gem. vertraging",
      kpiRemindersSent: "Herinneringen verstuurd",
      kpiNoHistory: "Nog geen gegevens",
      kpiEmptyCta: "Voeg je eerste klant toe om hier stats te zien",
      kpiEmptyReminders: "Stuur een eerste herinnering om verzendingen te volgen",
      foldersHintTitle: "Nieuw: Mappen",
      foldersHintCta: "Ontdekken",
      foldersHintClose: "Sluiten",
      kpiDays: "dagen",
      integrationsTitle: "Integraties",
      calendarBannerConnected: "Google Calendar verbonden",
      calendarBannerConnect: "Google Calendar koppelen",
      pipelineTitle: "Incasso-pipeline",
      pipelineHint: "Dossiers: aan te manen, herinnering verstuurd, komende vervaldag, betaald.",
      pipelineConfigure: "Klanten bekijken",
      pipelinePageTitle: "Incasso-pipeline",
      pipelinePageIntro:
        "Volg elk dossier van aanmaning tot betaling. Klik op een kaart om te herinneren of de fiche te openen.",
      pipelineViewAll: "Volledige pipeline",
      pipelineOpenFull: "Pipeline openen",
      pipelineBackHome: "Terug naar home",
      pipelineAddClient: "Klant toevoegen",
      colToRemind: "Aan te manen",
      colReminderSent: "Herinnering verstuurd",
      colPromised: "Komende vervaldag",
      colPaid: "Betaald",
      colEmpty: "Geen dossiers",
      priorityTitle: "Prioriteit opvolging",
      priorityEmpty: "Geen achterstallige openstaande dossiers.",
      priorityClient: "Klant",
      priorityAmount: "Bedrag",
      priorityDue: "Vervaldatum",
      priorityLast: "Herinnering",
      priorityAction: "Actie",
      priorityRemind: "Herinneren",
      priorityNever: "Nooit",
      priorityYesterday: "Recent",
      onboardingTitle: "Eerste stappen",
      onboardingOrg: "Organisatie invullen (naam, land)",
      onboardingGmail: "Google / Gmail instellen",
      onboardingClient: "Eerste klant toevoegen",
      onboardingReminder: "Eerste herinnering versturen",
      onboardingAuto: "Automatische herinneringen inschakelen",
      onboardingCtaOrg: "Organisatie",
      onboardingCtaIntegrations: "Integraties",
      onboardingCtaAdd: "Klant toevoegen",
      onboardingCtaRelances: "Herinneringen",
      onboardingDismiss: "Sluiten",
      onboardingShowAgain: "Eerste stappen",
      integrationsPageTitle: "Integraties",
      integrationsPageIntro:
        "Synchroniseer vervaldata en herinneringen van PayPulss met Google Calendar.",
      integrationsCalendarTitle: "Google Calendar",
      integrationsCalendarBody:
        "Klantvervaldata, verstuurde herinneringen, betalingen en persoonlijke organisatie-events in je Google-agenda.",
      calendarConnect: "Google Calendar koppelen",
      calendarDisconnect: "Ontkoppelen",
      calendarSyncNow: "Nu synchroniseren",
      calendarSyncing: "Bezig met synchroniseren…",
      calendarStatusConnected: "Verbonden",
      calendarStatusNotConnected: "Niet verbonden",
      calendarUnavailable: "Koppeling tijdelijk niet beschikbaar. Probeer later opnieuw.",
      calendarConnectedToast: "Google Calendar is gekoppeld.",
      calendarConnectFailed: "Koppelen mislukt. Probeer opnieuw.",
      calendarSyncSuccess: "Synchronisatie voltooid.",
      calendarSyncFailed: "Synchronisatie mislukt. Probeer opnieuw.",
      calendarLastSync: "Laatste sync",
      workspaceNav: "Workspace",
      navHome: "Home",
      navClients: "Klanten",
      navPipeline: "Pipeline",
      navRelances: "Herinneringen",
      navTreasury: "Cash",
      navOrganization: "Organisatie",
      asideLabel: "Zijpaneel home",
      asideOrgTitle: "Organisatie",
      asideOrgOpen: "Organisatie openen",
      asideOrgEmpty: "Vul naam en land in bij instellingen.",
      asideShortcutsTitle: "Snelkoppelingen",
      navIntegrations: "Integraties",
      navTeam: "Team",
      searchPlaceholder: "Zoek een klant…",
    },
    es: {
      homeGreeting: "Hola",
      newClient: "Nuevo cliente",
      sendReminder: "Recordatorio",
      kpiUnpaid: "Pendiente",
      kpiReceivedMonth: "Cobrado este mes",
      kpiAvgDelay: "Retraso medio",
      kpiRemindersSent: "Recordatorios enviados",
      kpiNoHistory: "Sin datos aún",
      kpiEmptyCta: "Añade tu primer cliente para ver las estadísticas aquí",
      kpiEmptyReminders: "Envía un primer recordatorio para seguir los envíos aquí",
      foldersHintTitle: "Nuevo: Carpetas",
      foldersHintCta: "Descubrir",
      foldersHintClose: "Cerrar",
      kpiDays: "días",
      integrationsTitle: "Integraciones",
      calendarBannerConnected: "Google Calendar conectado",
      calendarBannerConnect: "Conectar Google Calendar",
      pipelineTitle: "Pipeline de cobro",
      pipelineHint: "Seguimiento: a recordar, recordatorio enviado, vencimiento próximo, pagado.",
      pipelineConfigure: "Ver clientes",
      pipelinePageTitle: "Pipeline de cobro",
      pipelinePageIntro:
        "Sigue cada caso desde el recordatorio hasta el pago. Haz clic en una tarjeta para recordar o abrir la ficha.",
      pipelineViewAll: "Ver pipeline completo",
      pipelineOpenFull: "Abrir pipeline",
      pipelineBackHome: "Volver al inicio",
      pipelineAddClient: "Añadir cliente",
      colToRemind: "A recordar",
      colReminderSent: "Recordatorio enviado",
      colPromised: "Vencimiento próximo",
      colPaid: "Pagado",
      colEmpty: "Sin casos",
      priorityTitle: "Seguimiento prioritario",
      priorityEmpty: "No hay impagados vencidos por ahora.",
      priorityClient: "Cliente",
      priorityAmount: "Importe",
      priorityDue: "Vencimiento",
      priorityLast: "Recordatorio",
      priorityAction: "Acción",
      priorityRemind: "Recordar",
      priorityNever: "Nunca",
      priorityYesterday: "Reciente",
      onboardingTitle: "Primeros pasos",
      onboardingOrg: "Completar organización (nombre, país)",
      onboardingGmail: "Configurar Google / Gmail",
      onboardingClient: "Añadir primer cliente",
      onboardingReminder: "Enviar primer recordatorio",
      onboardingAuto: "Activar recordatorios automáticos",
      onboardingCtaOrg: "Organización",
      onboardingCtaIntegrations: "Integraciones",
      onboardingCtaAdd: "Añadir cliente",
      onboardingCtaRelances: "Recordatorios",
      onboardingDismiss: "Cerrar",
      onboardingShowAgain: "Primeros pasos",
      integrationsPageTitle: "Integraciones",
      integrationsPageIntro:
        "Sincroniza vencimientos y recordatorios de PayPulss con Google Calendar.",
      integrationsCalendarTitle: "Google Calendar",
      integrationsCalendarBody:
        "Vencimientos de clientes, recordatorios enviados, cobros y eventos personales de organización en tu calendario de Google.",
      calendarConnect: "Conectar Google Calendar",
      calendarDisconnect: "Desconectar",
      calendarSyncNow: "Sincronizar ahora",
      calendarSyncing: "Sincronizando…",
      calendarStatusConnected: "Conectado",
      calendarStatusNotConnected: "No conectado",
      calendarUnavailable: "Conexión no disponible por ahora. Inténtalo más tarde.",
      calendarConnectedToast: "Google Calendar está conectado.",
      calendarConnectFailed: "No se pudo conectar. Inténtalo de nuevo.",
      calendarSyncSuccess: "Sincronización completada.",
      calendarSyncFailed: "Error de sincronización. Inténtalo de nuevo.",
      calendarLastSync: "Última sincronización",
      workspaceNav: "Workspace",
      navHome: "Inicio",
      navClients: "Clientes",
      navPipeline: "Pipeline",
      navRelances: "Recordatorios",
      navTreasury: "Tesorería",
      navOrganization: "Organización",
      asideLabel: "Panel lateral inicio",
      asideOrgTitle: "Organización",
      asideOrgOpen: "Abrir organización",
      asideOrgEmpty: "Completa nombre y país en ajustes.",
      asideShortcutsTitle: "Accesos rápidos",
      navIntegrations: "Integraciones",
      navTeam: "Equipo",
      searchPlaceholder: "Buscar un cliente…",
    },
  });
}
