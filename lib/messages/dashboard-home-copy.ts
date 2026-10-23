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
  kpiHintUnpaid: string;
  kpiHintReceived: string;
  kpiHintDelay: string;
  kpiHintReminders: string;
  /** Subtext under owed total, e.g. "3 invoices · 2 overdue". */
  kpiOwedSubtext: (invoices: number, overdue: number) => string;
  legendOverdue: string;
  legendDueSoon: string;
  legendNotDue: string;
  sendRemindersBtn: (n: number) => string;
  sendRemindersConfirm: (n: number) => string;
  remindersThisMonth: (n: number) => string;
  priorityViewAll: string;
  priorityStatusOverdue: (n: number) => string;
  priorityStatusDueIn: (n: number) => string;
  priorityStatusDueOn: (dateLabel: string) => string;
  priorityDaysAgo: (n: number) => string;
  /** Header e.g. "Collected · last 6 months". */
  homeCashTitle: (periodLabel: string) => string;
  homeCashRange3m: string;
  homeCashRange6m: string;
  homeCashRange1y: string;
  homeCashSeg3m: string;
  homeCashSeg6m: string;
  homeCashSeg1y: string;
  homeCashCollected: string;
  homeCashStillOwed: string;
  homeCashEmptyHistory: string;
  homeCashPeriodAria: string;
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
      kpiUnpaid: "À encaisser",
      kpiReceivedMonth: "Encaissé ce mois",
      kpiAvgDelay: "Délai moyen",
      kpiRemindersSent: "Relances envoyées",
      kpiNoHistory: "Pas encore de données",
      kpiEmptyCta: "Ajoute ton premier client pour voir tes stats ici",
      kpiEmptyReminders: "Envoie une première relance pour suivre tes envois ici",
      kpiHintUnpaid: "Montant total encore dû",
      kpiHintReceived: "Somme encaissée ce mois",
      kpiHintDelay: "Temps moyen avant paiement",
      kpiHintReminders: "Relances déjà envoyées",
      kpiOwedSubtext: (invoices, overdue) =>
        `${invoices} facture${invoices === 1 ? "" : "s"} · ${overdue} en retard`,
      legendOverdue: "En retard",
      legendDueSoon: "Sous 7 jours",
      legendNotDue: "Pas encore dû",
      sendRemindersBtn: (n) => `Envoyer les relances (${n})`,
      sendRemindersConfirm: (n) =>
        n === 1
          ? "Envoyer une relance pour 1 facture en retard ?"
          : `Envoyer des relances pour ${n} factures en retard ? Vous confirmerez chaque e-mail.`,
      remindersThisMonth: (n) => `${n} ce mois`,
      priorityViewAll: "Voir tout",
      priorityStatusOverdue: (n) => `${n} jour${n === 1 ? "" : "s"} de retard`,
      priorityStatusDueIn: (n) => `Échéance dans ${n} jour${n === 1 ? "" : "s"}`,
      priorityStatusDueOn: (dateLabel) => `Échéance ${dateLabel}`,
      priorityDaysAgo: (n) =>
        n <= 0 ? "Aujourd'hui" : n === 1 ? "Il y a 1 jour" : `Il y a ${n} jours`,
      homeCashTitle: (periodLabel) => `Encaissé · ${periodLabel}`,
      homeCashRange3m: "3 derniers mois",
      homeCashRange6m: "6 derniers mois",
      homeCashRange1y: "12 derniers mois",
      homeCashSeg3m: "3M",
      homeCashSeg6m: "6M",
      homeCashSeg1y: "1A",
      homeCashCollected: "Encaissé",
      homeCashStillOwed: "Encore dû",
      homeCashEmptyHistory:
        "Votre historique d'encaissements apparaîtra ici une fois des factures payées.",
      homeCashPeriodAria: "Période du graphique",
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
      priorityEmpty: "Vous êtes à jour. Rien n'est en retard.",
      priorityClient: "Client",
      priorityAmount: "Montant",
      priorityDue: "Statut",
      priorityLast: "Dernière relance",
      priorityAction: "Action",
      priorityRemind: "Envoyer une relance",
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
      kpiUnpaid: "Owed to you",
      kpiReceivedMonth: "Collected this month",
      kpiAvgDelay: "Avg. delay",
      kpiRemindersSent: "Reminders sent",
      kpiNoHistory: "No data yet",
      kpiEmptyCta: "Add your first client to see stats here",
      kpiEmptyReminders: "Send a first reminder to track sends here",
      kpiHintUnpaid: "Total amount still due",
      kpiHintReceived: "Cash collected this month",
      kpiHintDelay: "Average time to get paid",
      kpiHintReminders: "Reminders already sent",
      kpiOwedSubtext: (invoices, overdue) =>
        `${invoices} invoice${invoices === 1 ? "" : "s"} · ${overdue} overdue`,
      legendOverdue: "Overdue",
      legendDueSoon: "Due within 7 days",
      legendNotDue: "Not yet due",
      sendRemindersBtn: (n) => `Send reminders (${n})`,
      sendRemindersConfirm: (n) =>
        n === 1
          ? "Send a reminder for 1 overdue invoice?"
          : `Send reminders for ${n} overdue invoices? You will confirm each email.`,
      remindersThisMonth: (n) => `${n} this month`,
      priorityViewAll: "View all",
      priorityStatusOverdue: (n) => `${n} day${n === 1 ? "" : "s"} overdue`,
      priorityStatusDueIn: (n) => `Due in ${n} day${n === 1 ? "" : "s"}`,
      priorityStatusDueOn: (dateLabel) => `Due ${dateLabel}`,
      priorityDaysAgo: (n) => (n <= 0 ? "Today" : n === 1 ? "1 day ago" : `${n} days ago`),
      homeCashTitle: (periodLabel) => `Collected · ${periodLabel}`,
      homeCashRange3m: "last 3 months",
      homeCashRange6m: "last 6 months",
      homeCashRange1y: "last 12 months",
      homeCashSeg3m: "3M",
      homeCashSeg6m: "6M",
      homeCashSeg1y: "1Y",
      homeCashCollected: "Collected",
      homeCashStillOwed: "Still owed",
      homeCashEmptyHistory:
        "Your cash-in history will appear here once invoices are paid.",
      homeCashPeriodAria: "Chart period",
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
      priorityEmpty: "You're all caught up. Nothing is overdue.",
      priorityClient: "Client",
      priorityAmount: "Amount",
      priorityDue: "Status",
      priorityLast: "Last reminder",
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
      kpiUnpaid: "Te innen",
      kpiReceivedMonth: "Ontvangen deze maand",
      kpiAvgDelay: "Gem. vertraging",
      kpiRemindersSent: "Herinneringen verstuurd",
      kpiNoHistory: "Nog geen gegevens",
      kpiEmptyCta: "Voeg je eerste klant toe om hier stats te zien",
      kpiEmptyReminders: "Stuur een eerste herinnering om verzendingen te volgen",
      kpiHintUnpaid: "Totaal nog openstaand",
      kpiHintReceived: "Ontvangen deze maand",
      kpiHintDelay: "Gemiddelde betaaltijd",
      kpiHintReminders: "Al verstuurde herinneringen",
      kpiOwedSubtext: (invoices, overdue) =>
        `${invoices} factuur${invoices === 1 ? "" : "en"} · ${overdue} te laat`,
      legendOverdue: "Te laat",
      legendDueSoon: "Binnen 7 dagen",
      legendNotDue: "Nog niet verschuldigd",
      sendRemindersBtn: (n) => `Herinneringen sturen (${n})`,
      sendRemindersConfirm: (n) =>
        n === 1
          ? "Herinnering sturen voor 1 te late factuur?"
          : `Herinneringen sturen voor ${n} te late facturen? Je bevestigt elke e-mail.`,
      remindersThisMonth: (n) => `${n} deze maand`,
      priorityViewAll: "Alles bekijken",
      priorityStatusOverdue: (n) => `${n} dag${n === 1 ? "" : "en"} te laat`,
      priorityStatusDueIn: (n) => `Over ${n} dag${n === 1 ? "" : "en"}`,
      priorityStatusDueOn: (dateLabel) => `Vervalt ${dateLabel}`,
      priorityDaysAgo: (n) =>
        n <= 0 ? "Vandaag" : n === 1 ? "1 dag geleden" : `${n} dagen geleden`,
      homeCashTitle: (periodLabel) => `Ontvangen · ${periodLabel}`,
      homeCashRange3m: "laatste 3 maanden",
      homeCashRange6m: "laatste 6 maanden",
      homeCashRange1y: "laatste 12 maanden",
      homeCashSeg3m: "3M",
      homeCashSeg6m: "6M",
      homeCashSeg1y: "1J",
      homeCashCollected: "Ontvangen",
      homeCashStillOwed: "Nog open",
      homeCashEmptyHistory:
        "Je ontvangstgeschiedenis verschijnt hier zodra facturen betaald zijn.",
      homeCashPeriodAria: "Grafiekperiode",
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
      priorityEmpty: "Je bent bij. Niets is te laat.",
      priorityClient: "Klant",
      priorityAmount: "Bedrag",
      priorityDue: "Status",
      priorityLast: "Laatste herinnering",
      priorityAction: "Actie",
      priorityRemind: "Herinnering sturen",
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
      kpiUnpaid: "Por cobrar",
      kpiReceivedMonth: "Cobrado este mes",
      kpiAvgDelay: "Retraso medio",
      kpiRemindersSent: "Recordatorios enviados",
      kpiNoHistory: "Sin datos aún",
      kpiEmptyCta: "Añade tu primer cliente para ver las estadísticas aquí",
      kpiEmptyReminders: "Envía un primer recordatorio para seguir los envíos aquí",
      kpiHintUnpaid: "Total aún por cobrar",
      kpiHintReceived: "Cobrado este mes",
      kpiHintDelay: "Tiempo medio de pago",
      kpiHintReminders: "Recordatorios ya enviados",
      kpiOwedSubtext: (invoices, overdue) =>
        `${invoices} factura${invoices === 1 ? "" : "s"} · ${overdue} vencida${overdue === 1 ? "" : "s"}`,
      legendOverdue: "Vencido",
      legendDueSoon: "En 7 días",
      legendNotDue: "Aún no vence",
      sendRemindersBtn: (n) => `Enviar recordatorios (${n})`,
      sendRemindersConfirm: (n) =>
        n === 1
          ? "¿Enviar un recordatorio para 1 factura vencida?"
          : `¿Enviar recordatorios para ${n} facturas vencidas? Confirmarás cada correo.`,
      remindersThisMonth: (n) => `${n} este mes`,
      priorityViewAll: "Ver todo",
      priorityStatusOverdue: (n) => `${n} día${n === 1 ? "" : "s"} de retraso`,
      priorityStatusDueIn: (n) => `Vence en ${n} día${n === 1 ? "" : "s"}`,
      priorityStatusDueOn: (dateLabel) => `Vence ${dateLabel}`,
      priorityDaysAgo: (n) =>
        n <= 0 ? "Hoy" : n === 1 ? "Hace 1 día" : `Hace ${n} días`,
      homeCashTitle: (periodLabel) => `Cobrado · ${periodLabel}`,
      homeCashRange3m: "últimos 3 meses",
      homeCashRange6m: "últimos 6 meses",
      homeCashRange1y: "últimos 12 meses",
      homeCashSeg3m: "3M",
      homeCashSeg6m: "6M",
      homeCashSeg1y: "1A",
      homeCashCollected: "Cobrado",
      homeCashStillOwed: "Aún por cobrar",
      homeCashEmptyHistory:
        "Tu historial de cobros aparecerá aquí cuando se paguen facturas.",
      homeCashPeriodAria: "Periodo del gráfico",
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
      priorityEmpty: "Estás al día. Nada está vencido.",
      priorityClient: "Cliente",
      priorityAmount: "Importe",
      priorityDue: "Estado",
      priorityLast: "Último recordatorio",
      priorityAction: "Acción",
      priorityRemind: "Enviar recordatorio",
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
