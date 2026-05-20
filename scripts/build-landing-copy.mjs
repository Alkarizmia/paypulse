import fs from "node:fs";

const frInner = fs.readFileSync("tmp-landing-fr.txt", "utf8").replace(/\s*}\s*$/m, "");
let enInner = fs.readFileSync("tmp-landing-en.txt", "utf8").replace(/\s*;\s*$/, "").replace(/\s*}\s*$/m, "");

const header = `import type { AppLocale } from "@/lib/app-locale";
import type { PlanId } from "@/lib/plans";

const fr = {
${frInner}
} as const;

const en = {
${enInner}
} as const;

`;

const nl = `const nl = {
          product: "Facturen en herinneringen voor freelancers",
          title: "PayPulss, herinneringen en cashflow voor freelancers",
          heroBadge: "Facturen · herinneringen · cashflow",
          heroSubline:
            "Automatiseer je opvolgingen, blijf on-brand en win tijd terug, zonder spreadsheet-chaos.",
          heroLine1: "De herinneringsmotor",
          heroLine2: "die je cashflow verdient.",
          body: "",
          microNoCard: "Geen creditcard nodig",
          heroTrustIntro: "Vertrouwen en helderheid",
          heroTrustPills: [
            "HTTPS-versleuteling",
            "Supabase of lokale modus",
            "Installeerbare PWA",
            "Herinneringen afgestemd op vervaldata",
          ],
          socialProof: "Al door 100+ freelancers gebruikt",
          statsTitle: "Resultaten die je voelt",
          statsSub: "Gebaseerd op gebruikersfeedback, indicatieve cijfers.",
          stat1Val: "−35%",
          stat1Lab: "minder vergeten opvolgingen",
          stat2Val: "+18%",
          stat2Lab: "sneller betaald (typisch)",
          stat3Val: "4u",
          stat3Lab: "gemiddeld per week bespaard",
          ctaTrial: "Gratis starten",
          ctaDashboard: "Naar dashboard",
          ctaPricing: "Zo werkt het",
          demoAnchor: "demo",
          pricingAnchor: "pricing",
          featuresTitle: "Minder late facturen. Meer cash. Meer tijd voor jou.",
          featuresSub: "Wat PayPulss discreet regelt, zonder spreadsheet-chaos.",
          recurringTitle: "Dezelfde klant, maand na maand, zonder alles opnieuw te maken",
          recurringBody:
            "Zodra een factuur betaald is, maakt een kleine omkeer naast de badge Betaald een nieuwe rij voor de volgende periode (naam x2, x3…), onbetaald met de nieuwe vervaldatum, terwijl de vorige rij Betaald blijft met betaaldatum. Grafieken en overzicht houden één rij per periode, helder voor jou en je klant.",
          recurringImgAlt:
            "Illustratie: factuurkaart met Betaald-badge; de omkeer ernaast is een interactieve productpreview.",
          recurringArrowAria: "Preview: omkeer voor de volgende factuurcyclus (hover om te animeren).",
          recurringStep1Label: "Stap 1",
          recurringStep1Badge: "Betaald",
          recurringStep1Body: "De factuur van deze maand is vereffend.",
          recurringStep2Label: "Stap 2",
          recurringStep2Badge: "Onbetaald te laat",
          recurringStep2Body: "Er wordt een nieuwe rij voor de volgende maand aangemaakt, met actieve opvolging.",
          demoTitle: "Wat de MVP dekt",
          demoSub:
            "Eén rustig scherm: klanten, facturen, statussen, herinneringen en dashboard-grafieken (cash-in-trend, betaald versus openstaand). AI-herinneringen komen later.",
          demoBullets: [
            "Klantrijen met openstaand bedrag en vervaldatum",
            "Betaald versus onbetaald in één oogopslag",
            "Herinneringen: preview en verzenden vanuit je mailapp",
            "Evolutiegrafiek en donut betaald, openstaand, te laat",
          ],
          demoModeHint: "Klik om te wisselen tussen lichte en donkere modus",
          demoModeDark: "Donkere modus",
          demoModeLight: "Lichte modus",
          faqTitle: "Veelgestelde vragen",
          faqSub: "Korte antwoorden; mail ons voor uitzonderingen.",
          faqItems: [
            {
              q: "Waar worden mijn gegevens opgeslagen?",
              a: "Zonder Supabase blijven gegevens in je browser (lokale modus). Met Supabase staan ze in je cloudproject, beschermd door de toegangsregels die je uitrolt.",
            },
            {
              q: "Kan ik het proberen zonder creditcard?",
              a: "Ja. Het gratis niveau volstaat om flows en de limieten op het dashboard te testen.",
            },
            {
              q: "Worden herinneringen automatisch verstuurd?",
              a: "De MVP opent een preview (onderwerp plus tekst) zodat je verzenden bevestigt vanuit je mailapp. Volledig automatisch hangt af van plan en instellingen.",
            },
            {
              q: "Waarom zie ik niet dezelfde grafieken als op jullie homepage?",
              a: "De screenshot op de site is een demo (voorbeeldcijfers) van het volledige dashboard. In de app toont het gratis plan de hoofdtotalen maar niet de evolutiegrafiek of de donut; die ontgrendelen vanaf Starter (zie plannen).",
            },
            {
              q: "Hoe is dit beter dan een spreadsheet?",
              a: "Minder knippen en plakken: een dossierlijst, consistente statussen en contextuele herinneringen in plaats van handmatig filteren.",
            },
          ],
          personaTitle: "Lucas, freelance designer",
          personaQuote: "Ik stuurde facturen en vergat wie nog moest betalen. Opvolgen voelde ongemakkelijk.",
          beforeTitle: "Voorheen",
          beforeBody: "Geen duidelijk beeld van te late betalingen, losse mails, bang om opdringerig over te komen.",
          beforeRows: [
            { name: "Klant A", amount: "? €", state: "21 d te laat" },
            { name: "Klant B", amount: "—", state: "Herinnering gemist" },
            { name: "Klant ?", amount: "???", state: "Status onbekend" },
          ] as const,
          afterTitle: "Nu",
          afterBody: "Een korte lijst, herinneringen op tijd, meer zicht op wat op je rekening komt.",
          afterRows: [
            { name: "Acme studio", amount: "€ 1.240", state: "Herinnerd D+3", kind: "ok" },
            { name: "Lefèvre en Co", amount: "€ 860", state: "Betaald", kind: "paid" },
            { name: "Belair", amount: "€ 2.100", state: "Gepland D+7", kind: "scheduled" },
          ] as const,
          pricingTitle: "Plannen",
          pricingSub: "Indicatieve prijzen. Start gratis; stap over op Starter als het volume stijgt.",
          pricingBillingMonthly: "Maandelijks",
          pricingBillingAnnual: "Jaarlijks",
          pricingAnnualSavingsNote: "Bespaar 20% met jaarlijkse facturatie",
          pricingAnnualSavingsBadge: "20%",
          pricingAnnualOldLabel: "in plaats van",
          popular: "Populair",
          footerProduct: "Product",
          footerCompany: "Bedrijf",
          footerLegal: "Juridisch",
          footerLinks: {
            features: "Functies",
            preview: "Preview",
            pricing: "Prijzen",
            faq: "FAQ",
            about: "Over ons",
            founder: "Oprichter",
            careers: "Vacatures",
            contact: "Contact",
            contactEmail: "Mail ons",
            privacy: "Privacy",
            terms: "Voorwaarden",
            legalHub: "Juridisch overzicht",
            mentions: "Wettelijke vermelding",
            security: "Gegevensbeveiliging",
            footerProductTour: "Product in beeld",
            footerHowLink: "Hoe het werkt",
          },
          visualShowcaseTitle: "Zie het product visueel",
          visualShowcaseSub: "Minimale schema’s van kernflows. De volledige UI zit in de app.",
          visualShowcaseScrollHint:
            "Automatisch scrollend. Hover over de band om te pauzeren en een kaart te lezen.",
          visualMarqueeDueTitle: "Vervaldagen in zicht",
          visualMarqueeDueBody: "Deadlines en vertragingen helder voordat een herinnering uitgaat.",
          visualMarqueeSecurityTitle: "Gegevens onder jouw controle",
          visualMarqueeSecurityBody: "Lokaal of cloud: jij kiest waar informatie leeft.",
          visualMarqueeRhythmTitle: "Stabiel tempo",
          visualMarqueeRhythmBody: "Opvolging met ritme: professioneel zonder te spammen.",
          visualClientsTitle: "Klanten en facturen",
          visualClientsBody: "Elk dossier: bedrag, vervaldatum, status. Geen verspreide spreadsheet.",
          visualClientsAlt: "PayPulss UI-preview: dossierlijst met bedragen en statuschips",
          visualRelancesTitle: "Gestructureerde herinneringen",
          visualRelancesBody: "E-mails klaar om te versturen, strak tempo, professionele toon.",
          visualRelancesAlt: "PayPulss UI-preview: concept van een herinneringsmail",
          visualTreasuryTitle: "Cashflow-dashboard",
          visualTreasuryBody: "Openstaand, ontvangen, te laat: je financiële gezondheid in één oogopslag.",
          visualTreasuryAlt: "PayPulss UI-preview: KPI-kaarten en treasury-grafieken",
          howCtaSignup: "Gratis account aanmaken",
          howCtaDemo: "Bekijk de interactieve preview",
          howCtaContact: "Neem contact op",
          planCtaEnFallback: "Aan de slag",
          demo: {
            panelTitle: "PayPulss · Preview",
            tabIn: "Ontvangen",
            tabOut: "Te herinneren",
            rowClient: "Mirabelle Studio",
            rowAmount: "1.890 €",
            rowStatus: "3 dagen na vervaldatum",
            dueLabel: "Te laat",
            toggleLabel: "Auto-herinnering",
            receiptTitle: "Bijlage",
            receiptLine: "Factuur · logo-opdracht",
            receiptTotal: "640 €",
            floatLabel: "Herinnering dag 7",
          },
          chartsMock: {
            windowTitle: "PayPulss · Dashboard",
            pending: "Openstaand bedrag",
            pendingVal: "8.420 €",
            received: "Ontvangen deze maand",
            receivedVal: "3.180 €",
            receivedHint: "+12% t.o.v. vorige maand",
            overdue: "Achterstallige facturen",
            overdueVal: "2",
            evolution: "Ontwikkeling ontvangsten",
            evolutionHint: "Som van betaalde facturen per maand (voorbeelddata).",
            distribution: "Verdeling facturen",
            paid: "Betaald",
            pendingL: "Openstaand",
            overdueL: "Te laat",
            totalLabel: "Totaal",
            monthLabels: ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun"] as const,
          },
          founderKicker: "Een gezicht achter het product",
          founderRole: "Oprichter, PayPulss",
          installLabels: {
            defaultLabel: "PayPulss downloaden",
            mobileLabel: "Installeren op mobiel",
            macLabel: "Downloaden voor Mac",
            windowsLabel: "Downloaden voor Windows",
            secondaryLabel: "App installeren",
          },
          problemTitle: "Het probleem zijn niet je klanten. Het is timing.",
          problemBody:
            "Late betalingen raken je liquiditeit, kosten tijd en frictie. PayPulss automatiseert opvolging zonder de klantrelatie te schaden.",
          solutionTitle: "Een strakke herinneringsmotor, gebouwd voor snelheid.",
          solutionBody:
            "Elke factuur wordt gevolgd, elke opvolging blijft consistent, elke betaling zichtbaar in één helder dashboard.",
          howTitle: "Hoe het werkt",
          howKicker: "Typische flow",
          howSubtitle:
            "Eenvoudige volgorde: wat jij doet, wat PayPulss voor je regelt; we benoemen wie welke stap beheert.",
          howConcernLabel: "Betrokkenen",
          howFlowSteps: [
            {
              headline: "Breng klanten en facturen samen in één hub",
              whoLabel: "Jij",
              whoHint: "Freelancers, zzp’ers, kleine teams: iedereen die factureert en betalingen volgt.",
              body: "Voeg dossiers en vervaldata in minuten toe: PayPulss vervangt verspreide sheets door één leesbare lijst.",
            },
            {
              headline: "Houd vervaldata in de gaten en bereid herinneringen voor",
              whoLabel: "PayPulss",
              whoHint: "De app bewaakt en bereidt berichten voor; het is geen mens die namens jou belt.",
              body: "Het markeert wat ertoe doet volgens je setup en bereidt herinneringen voor (onderwerp, toon, ritme) passend bij plan en instellingen.",
            },
            {
              headline: "Sneller betaald met duidelijkere opvolging",
              whoLabel: "Jij en je klanten",
              whoHint: "De commerciële relatie blijft van jou; klanten worden begeleid naar betaling zonder eindeloos heen-en-weer.",
              body: "Jij houdt controle waar het telt en ziet betaald versus laat in één oogopslag, zonder handmatig speurwerk.",
            },
          ],
          aboutTitle: "Maak kennis met ons",
          aboutBody:
            "Ik ben El Fahmi Bilal, oprichter van PayPulss. Het product komt uit een simpele observatie: te veel zelfstandigen verliezen tijd en cashflow met het najagen van facturen en ongemakkelijke opvolgingen. PayPulss geeft je helderheid: een leesbare dossierlijst, betrouwbare statussen, herinneringen die bij je merk passen, met minder mentale last. Mijn waarden: transparantie (jij bepaalt waar data staat), nette uitvoering, en een tool die maand na maand eenvoudig blijft.",
          aboutExpertiseTitle: "Expertise",
          aboutBullets: [
            "Product en UX, facturen, herinneringen, cashflow-dashboard",
            "Moderne webengineering (Next.js) en integraties (Supabase, e-mail)",
            "Automatisering van vervaldata-opvolging en herinneringsflows",
            "Kwaliteit en snelle iteratie zonder helderheid op te offeren",
            "Lange termijn: een SaaS voor elke dag, geen gimmick",
          ],
          finalCtaTitle: "Hou op met je geld na te jagen",
          finalCtaButton: "Gratis starten",
          features: [
            { kind: "clients" as const, title: "Klanten en facturen", body: "Centraliseer dossiers, bedragen en vervaldata zonder verspreide spreadsheets." },
            { kind: "status" as const, title: "Betaald of onbetaald", body: "Elke rij toont een duidelijke status zodat je weet wie je eerst herinnert." },
            { kind: "remind" as const, title: "E-mailherinneringen", body: "Concepten klaar om te versturen, handmatige verzending in de MVP; automatische herinneringen vanaf Pro." },
            { kind: "dash" as const, title: "Dashboard", body: "Openstaand, ontvangen deze maand, gemiddelde vertraging: cashgezondheid in één oogopslag." },
            { kind: "auto" as const, title: "Automatisering", body: "Herinneringen in het product op basis van vervaldatum; Pro- en Agency-plan: tot 2 of 3 workspaces om merken of activiteiten te scheiden." },
            { kind: "data" as const, title: "Gegevens onder controle", body: "Lokale modus of Supabase: jij kiest waar de database staat." },
          ],
} as const;
`;

const es = `const es = {
          product: "Facturas y recordatorios para autónomos",
          title: "PayPulss, recordatorios y flujo de caja para autónomos",
          heroBadge: "Facturas · recordatorios · flujo de caja",
          heroSubline:
            "Automatiza tus seguimientos, mantén tu tono de marca y recupera tiempo, sin caos de hojas de cálculo.",
          heroLine1: "El motor de recordatorios",
          heroLine2: "que tu flujo de caja merece.",
          body: "",
          microNoCard: "No se requiere tarjeta",
          heroTrustIntro: "Confianza y claridad",
          heroTrustPills: [
            "Cifrado HTTPS",
            "Supabase o modo local",
            "PWA instalable",
            "Recordatorios alineados con el vencimiento",
          ],
          socialProof: "Ya usado por más de 100 autónomos",
          statsTitle: "Resultados que se notan",
          statsSub: "Basado en feedback de usuarios, cifras orientativas.",
          stat1Val: "−35%",
          stat1Lab: "menos seguimientos olvidados",
          stat2Val: "+18%",
          stat2Lab: "cobro más rápido (típico)",
          stat3Val: "4h",
          stat3Lab: "ahorradas por semana de media",
          ctaTrial: "Empezar gratis",
          ctaDashboard: "Ir al panel",
          ctaPricing: "Ver cómo funciona",
          demoAnchor: "demo",
          pricingAnchor: "pricing",
          featuresTitle: "Menos facturas tardías. Más efectivo. Más tiempo para ti.",
          featuresSub: "Lo que PayPulss gestiona en silencio, sin caos de hojas de cálculo.",
          recurringTitle: "El mismo cliente, mes tras mes, sin recrear filas",
          recurringBody:
            "Cuando una factura se marca como pagada, un pequeño retorno junto a la insignia Pagada crea una fila nueva para el siguiente periodo (sufijo x2, x3…), pendiente con la nueva fecha, mientras la fila anterior sigue Pagada con su fecha. Los gráficos y el resumen mantienen una fila por periodo, claro para ti y tu cliente.",
          recurringImgAlt:
            "Ilustración: tarjeta de factura con insignia Pagada; el control de retorno al lado es una vista previa interactiva.",
          recurringArrowAria: "Vista previa: retorno para el siguiente ciclo (pasa el cursor para animar).",
          recurringStep1Label: "Paso 1",
          recurringStep1Badge: "Pagada",
          recurringStep1Body: "La factura del mes en curso está saldada.",
          recurringStep2Label: "Paso 2",
          recurringStep2Badge: "Pendiente vencida",
          recurringStep2Body: "Se crea una fila nueva para el mes siguiente, con seguimiento activo.",
          demoTitle: "Qué cubre el MVP",
          demoSub:
            "Una pantalla tranquila: clientes, facturas, estados, recordatorios y gráficos tipo panel (tendencia de cobros, pagado frente a pendiente). Los recordatorios redactados por IA llegarán más adelante.",
          demoBullets: [
            "Filas de cliente con importe y fecha de vencimiento",
            "Estado pagado o pendiente visible de un vistazo",
            "Recordatorios: vista previa y envío desde tu correo",
            "Gráfico de evolución y donut pagado, pendiente, vencido",
          ],
          demoModeHint: "Clic para alternar modo claro y oscuro",
          demoModeDark: "Modo oscuro",
          demoModeLight: "Modo claro",
          faqTitle: "Preguntas frecuentes",
          faqSub: "Respuestas breves; escríbenos para casos especiales.",
          faqItems: [
            {
              q: "¿Dónde se almacenan mis datos?",
              a: "Sin Supabase, los datos permanecen en tu navegador (modo local). Con Supabase, viven en tu proyecto en la nube, protegidos por las reglas de acceso que despliegas.",
            },
            {
              q: "¿Puedo probar sin tarjeta?",
              a: "Sí. El nivel gratuito basta para probar flujos y los límites que ves en el panel.",
            },
            {
              q: "¿Los recordatorios se envían solos?",
              a: "El MVP abre una vista previa (asunto y cuerpo) para que confirmes el envío desde tu correo. El envío automático completo depende del plan y la configuración.",
            },
            {
              q: "¿Por qué no veo los mismos gráficos que en vuestra web?",
              a: "La captura del sitio es una demo (números de ejemplo) del panel completo. En la app, el plan gratuito muestra los totales clave pero no el gráfico de evolución ni el donut; se desbloquean desde Starter (ver planes).",
            },
            {
              q: "¿Qué ventaja tiene frente a una hoja de cálculo?",
              a: "Menos copiar y pegar: lista de expedientes, estados coherentes y recordatorios contextuales en lugar de filtrar filas a mano.",
            },
          ],
          personaTitle: "Lucas, diseñador freelance",
          personaQuote: "Enviaba facturas y olvidaba quién debía. Dar el corte me generaba incomodidad.",
          beforeTitle: "Antes",
          beforeBody: "Sin visión clara de lo vencido, correos sueltos, miedo a parecer insistente.",
          afterTitle: "Después",
          afterBody: "Lista corta, recordatorios a tiempo, más claridad sobre lo que entra en cuenta.",
          beforeRows: [
            { name: "Cliente A", amount: "? €", state: "21 d de retraso" },
            { name: "Cliente B", amount: "—", state: "Recordatorio olvidado" },
            { name: "Cliente ?", amount: "???", state: "Estado desconocido" },
          ] as const,
          afterRows: [
            { name: "Acme studio", amount: "1.240 €", state: "Recordatorio D+3", kind: "ok" },
            { name: "Lefèvre y Co", amount: "860 €", state: "Pagada", kind: "paid" },
            { name: "Belair", amount: "2.100 €", state: "Programada D+7", kind: "scheduled" },
          ] as const,
          pricingTitle: "Planes",
          pricingSub: "Precios orientativos. Empieza gratis; pasa a Starter cuando suba el volumen.",
          pricingBillingMonthly: "Mensual",
          pricingBillingAnnual: "Anual",
          pricingAnnualSavingsNote: "Ahorra un 20% con facturación anual",
          pricingAnnualSavingsBadge: "20%",
          pricingAnnualOldLabel: "en lugar de",
          popular: "Popular",
          footerProduct: "Producto",
          footerCompany: "Empresa",
          footerLegal: "Legal",
          footerLinks: {
            features: "Funciones",
            preview: "Vista previa",
            pricing: "Precios",
            faq: "FAQ",
            about: "Sobre nosotros",
            founder: "Fundador",
            careers: "Empleo",
            contact: "Contacto",
            contactEmail: "Escríbenos",
            privacy: "Privacidad",
            terms: "Términos",
            legalHub: "Información legal",
            mentions: "Aviso legal",
            security: "Seguridad de datos",
            footerProductTour: "El producto en imágenes",
            footerHowLink: "Cómo funciona",
          },
          visualShowcaseTitle: "Mira el producto en imágenes",
          visualShowcaseSub: "Esquemas mínimos de los flujos clave. La UI completa está en la app.",
          visualShowcaseScrollHint:
            "Carrusel automático. Pasa el cursor por la franja para pausar y leer una tarjeta.",
          visualMarqueeDueTitle: "Vencimientos a la vista",
          visualMarqueeDueBody: "Plazos y retrasos claros antes de enviar un recordatorio.",
          visualMarqueeSecurityTitle: "Datos bajo tu control",
          visualMarqueeSecurityBody: "Local o nube: tú eliges dónde vive la información.",
          visualMarqueeRhythmTitle: "Ritmo constante",
          visualMarqueeRhythmBody: "Seguimientos espaciados: profesional sin insistir.",
          visualClientsTitle: "Clientes y facturas",
          visualClientsBody: "Cada expediente: importe, vencimiento, estado. Sin hojas dispersas.",
          visualClientsAlt: "Vista previa PayPulss: lista de expedientes con importes y estado",
          visualRelancesTitle: "Recordatorios estructurados",
          visualRelancesBody: "Correos listos para enviar, ritmo firme, tono profesional.",
          visualRelancesAlt: "Vista previa PayPulss: borrador de recordatorio",
          visualTreasuryTitle: "Panel de flujo de caja",
          visualTreasuryBody: "Pendiente, cobrado, vencido: tu salud financiera de un vistazo.",
          visualTreasuryAlt: "Vista previa PayPulss: KPI y gráficos de tesorería",
          howCtaSignup: "Crear cuenta gratis",
          howCtaDemo: "Ver la vista previa interactiva",
          howCtaContact: "Contactar",
          planCtaEnFallback: "Empezar",
          demo: {
            panelTitle: "PayPulss · Vista previa",
            tabIn: "Cobrado",
            tabOut: "A recordar",
            rowClient: "Estudio Mirabelle",
            rowAmount: "1.890 €",
            rowStatus: "3 días de retraso",
            dueLabel: "Vencida",
            toggleLabel: "Auto recordatorio",
            receiptTitle: "Adjunto",
            receiptLine: "Factura · sprint de logo",
            receiptTotal: "640 €",
            floatLabel: "Recordatorio día 7",
          },
          chartsMock: {
            windowTitle: "PayPulss · Panel",
            pending: "Importe pendiente",
            pendingVal: "8.420 €",
            received: "Cobrado este mes",
            receivedVal: "3.180 €",
            receivedHint: "+12% frente al mes pasado",
            overdue: "Facturas vencidas",
            overdueVal: "2",
            evolution: "Evolución de cobros",
            evolutionHint: "Suma de facturas pagadas por mes (datos de ejemplo).",
            distribution: "Desglose de facturas",
            paid: "Pagadas",
            pendingL: "Pendientes",
            overdueL: "Vencidas",
            totalLabel: "Total",
            monthLabels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"] as const,
          },
          founderKicker: "Una cara detrás del producto",
          founderRole: "Fundador, PayPulss",
          installLabels: {
            defaultLabel: "Descargar PayPulss",
            mobileLabel: "Instalar en móvil",
            macLabel: "Descargar para Mac",
            windowsLabel: "Descargar para Windows",
            secondaryLabel: "Instalar la app",
          },
          problemTitle: "El problema no son tus clientes. Es el calendario de cobros.",
          problemBody:
            "Los pagos tardíos lastran el flujo de caja, consumen tiempo y generan fricción. PayPulss automatiza el seguimiento sin dañar la relación.",
          solutionTitle: "Un motor de recordatorios pulido, pensado para ir rápido.",
          solutionBody:
            "Cada factura se sigue, cada recordatorio mantiene el tono y cada pago se ve en un panel claro.",
          howTitle: "Cómo funciona",
          howKicker: "Flujo típico",
          howSubtitle:
            "Secuencia sencilla: qué haces tú, qué hace PayPulss por ti; indicamos quién interviene en cada paso.",
          howConcernLabel: "Quién interviene",
          howFlowSteps: [
            {
              headline: "Reúne clientes y facturas en un solo hub",
              whoLabel: "Tú",
              whoHint: "Autónomos, equipos pequeños: quien factura y sigue cobros.",
              body: "Añade expedientes y vencimientos en minutos: PayPulss sustituye hojas dispersas por una lista legible.",
            },
            {
              headline: "Vigila vencimientos y prepara recordatorios",
              whoLabel: "PayPulss",
              whoHint: "La app vigila y redacta borradores; no es una persona llamando por ti.",
              body: "Marca lo importante según tu configuración y prepara recordatorios (asunto, tono, ritmo) alineados con tu plan.",
            },
            {
              headline: "Cobra con más fluidez y seguimiento claro",
              whoLabel: "Tú y tus clientes",
              whoHint: "La relación comercial sigue siendo tuya; el cliente se guía hasta el pago.",
              body: "Sigues al mando cuando importa y ves pagado frente a retrasado de un vistazo, sin arqueología manual.",
            },
          ],
          aboutTitle: "Conócenos",
          aboutBody:
            "Soy El Fahmi Bilal, fundador de PayPulss. El producto nace de una observación simple: demasiados independientes pierden tiempo y flujo de caja persiguiendo facturas y seguimientos incómodos. PayPulss busca darte claridad: lista de expedientes legible, estados fiables, recordatorios acordes con tu marca, con menos carga mental. Mis valores: transparencia (tú controlas dónde viven los datos), ejecución cuidada y una herramienta que siga siendo simple mes a mes.",
          aboutExpertiseTitle: "Experiencia",
          aboutBullets: [
            "Producto y UX, facturas, recordatorios, panel de flujo de caja",
            "Ingeniería web moderna (Next.js) e integraciones (Supabase, correo)",
            "Automatización de seguimiento por vencimiento y flujos de recordatorio",
            "Calidad e iteración rápida sin perder claridad",
            "Visión de largo plazo: un SaaS para el día a día, no un gadget",
          ],
          finalCtaTitle: "Deja de perseguir tu dinero",
          finalCtaButton: "Empezar gratis",
          features: [
            { kind: "clients" as const, title: "Clientes y facturas", body: "Centraliza expedientes, importes y vencimientos sin hojas dispersas." },
            { kind: "status" as const, title: "Pagado o pendiente", body: "Cada fila muestra un estado claro para priorizar a quién recordar." },
            { kind: "remind" as const, title: "Recordatorios por correo", body: "Borradores listos, envío manual en el MVP; recordatorios automáticos desde Pro." },
            { kind: "dash" as const, title: "Panel", body: "Pendiente, cobrado este mes, retraso medio: salud de caja de un vistazo." },
            { kind: "auto" as const, title: "Automatización", body: "Recordatorios en el producto según vencimiento; en Agency, un segundo espacio de trabajo para otra marca o línea." },
            { kind: "data" as const, title: "Datos bajo tu control", body: "Modo local o Supabase: tú eliges dónde vive la base de datos." },
          ],
} as const;
`;

const tail = `
const PACKS = { fr, en, nl, es } as const;

export type LandingCopy = (typeof PACKS)["fr"];

export function getLandingCopy(locale: AppLocale): LandingCopy {
  return PACKS[locale] as LandingCopy;
}

export type LocalizedPlanCard = {
  name: string;
  description: string;
  features: string[];
  periodLabel: string;
  cta: string;
};

const PLAN_FR: Record<PlanId, LocalizedPlanCard> = {
  free: {
    name: "Gratuit",
    description: "Pour tester : quelques clients, quelques factures, rappels simples.",
    features: ["3 clients maximum", "5 factures maximum", "Rappels e-mail basiques"],
    periodLabel: "gratuit",
    cta: "Tester gratuitement",
  },
  starter: {
    name: "Starter",
    description: "L’offre la plus choisie quand l’argent doit vraiment rentrer.",
    features: [
      "Clients illimités",
      "Tableau de bord : en attente, reçu, retard moyen",
      "Graphiques d’évolution et répartition (encaissements, payé / en attente)",
      "Relances automatiques + 1 modèle de relance personnalisable (sans lien de paiement)",
    ],
    periodLabel: "/mois",
    cta: "Choisir Starter",
  },
  pro: {
    name: "Pro",
    description: "Quand vous voulez des relances plus travaillées sans tout réécrire.",
    features: [
      "Relances automatiques",
      "Brouillons de relance assistés par IA (à venir)",
      "Statistiques de paiement avancées",
      "Modèles d’e-mails réutilisables",
      "Jusqu’à 2 portefeuilles (workspaces) pour isoler des marques ou activités",
    ],
    periodLabel: "/mois",
    cta: "Choisir Pro",
  },
  agency: {
    name: "Agence",
    description: "Plusieurs marques, plusieurs personnes, un suivi qui reste lisible.",
    features: [
      "Jusqu’à 3 portefeuilles (workspaces) pour isoler des marques ou activités",
      "Multi-clients / multi-marques",
      "Rôles pour l’équipe",
    ],
    periodLabel: "/mois",
    cta: "Parler à l’équipe",
  },
};

const PLAN_NL: Record<PlanId, LocalizedPlanCard> = {
  free: {
    name: "Gratis",
    description: "Probeer de flow: een paar klanten, een paar facturen, eenvoudige herinneringen.",
    features: ["Max. 3 klanten", "Max. 5 facturen", "Basis e-mailherinneringen"],
    periodLabel: "gratis",
    cta: "Gratis proberen",
  },
  starter: {
    name: "Starter",
    description: "Het plan dat freelancers kiezen zodra er echt geld beweegt.",
    features: [
      "Onbeperkt klanten",
      "Dashboard: openstaand, ontvangen, gem. vertraging",
      "Evolutie- en verdeelgrafieken (cash-in, betaald / openstaand)",
      "Automatische herinneringen + 1 aanpasbare e-mailtemplate (geen betaallink)",
    ],
    periodLabel: "/maand",
    cta: "Kies Starter",
  },
  pro: {
    name: "Pro",
    description: "Voor scherpere opvolging zonder elke mail opnieuw te schrijven.",
    features: [
      "Automatische herinneringen",
      "AI-ondersteunde concepten (later)",
      "Geavanceerde betaalstatistieken",
      "Herbruikbare e-mailtemplates",
      "Tot 2 workspaces om merken of activiteiten te scheiden",
    ],
    periodLabel: "/maand",
    cta: "Kies Pro",
  },
  agency: {
    name: "Agency",
    description: "Meerdere merken, meerdere mensen — toch één rustig overzicht.",
    features: [
      "Tot 3 workspaces om merken of activiteiten te scheiden",
      "Multi-klant / multi-merk",
      "Rollen voor het team",
    ],
    periodLabel: "/maand",
    cta: "Neem contact op",
  },
};

const PLAN_ES: Record<PlanId, LocalizedPlanCard> = {
  free: {
    name: "Gratis",
    description: "Prueba el flujo: unos clientes, unas facturas, recordatorios básicos.",
    features: ["Hasta 3 clientes", "Hasta 5 facturas", "Recordatorios por correo básicos"],
    periodLabel: "gratis",
    cta: "Probar gratis",
  },
  starter: {
    name: "Starter",
    description: "El plan que eligen los freelancers cuando el dinero empieza a moverse.",
    features: [
      "Clientes ilimitados",
      "Panel: pendiente, cobrado, retraso medio",
      "Gráficos de evolución y reparto (tendencia de cobros, pagado / pendiente)",
      "Recordatorios automáticos + 1 plantilla personalizable (sin enlace de pago)",
    ],
    periodLabel: "/mes",
    cta: "Elegir Starter",
  },
  pro: {
    name: "Pro",
    description: "Para seguimientos más finos sin reescribir cada correo.",
    features: [
      "Recordatorios automáticos",
      "Borradores asistidos por IA (próximamente)",
      "Estadísticas de cobro avanzadas",
      "Plantillas de correo reutilizables",
      "Hasta 2 espacios de trabajo para separar marcas o actividades",
    ],
    periodLabel: "/mes",
    cta: "Elegir Pro",
  },
  agency: {
    name: "Agency",
    description: "Varias marcas, varias personas — un solo panel tranquilo.",
    features: [
      "Hasta 3 espacios de trabajo para separar marcas o líneas de negocio",
      "Multi-cliente / multi-marca",
      "Roles para el equipo",
    ],
    periodLabel: "/mes",
    cta: "Hablar con el equipo",
  },
};

export function getLocalizedPlanCard(locale: AppLocale, planId: PlanId): LocalizedPlanCard | null {
  if (locale === "fr") return PLAN_FR[planId];
  if (locale === "nl") return PLAN_NL[planId];
  if (locale === "es") return PLAN_ES[planId];
  return null;
}

export function pricingAnnualPeriodLabel(locale: AppLocale): string {
  if (locale === "fr") return "/an";
  if (locale === "nl") return "/jaar";
  if (locale === "es") return "/año";
  return "/year";
}
`;

fs.writeFileSync("lib/messages/landing-copy.ts", header + nl + "\n" + es + "\n" + tail);
console.log("OK lib/messages/landing-copy.ts");
