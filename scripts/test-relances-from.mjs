/**
 * Test Resend : vérifie qu’un envoi part bien avec l’expéditeur relances (ou celui des variables d’env).
 *
 * Prérequis dans .env.local :
 *   RESEND_API_KEY=re_...
 *   TEST_REMINDER_TO=ton@email.com     (destinataire du test)
 * Optionnel :
 *   MAIL_FROM_AUTO_REMINDERS=relances@paypulss.com
 *   MAIL_FROM=...                      (repli si pas d’adresse auto)
 *
 * Usage (VS Code / terminal) :
 *   npm run test:relances-email
 */

import { config } from "dotenv";
import { Resend } from "resend";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", ".env.local") });

const apiKey = process.env.RESEND_API_KEY?.trim();
const to = process.env.TEST_REMINDER_TO?.trim();
const from =
  process.env.MAIL_FROM_AUTO_REMINDERS?.trim() ||
  process.env.MAIL_FROM?.trim() ||
  "relances@paypulss.com";

async function main() {
  if (!apiKey) {
    console.error("❌ RESEND_API_KEY manquant dans .env.local");
    process.exit(1);
  }
  if (!to) {
    console.error(
      "❌ TEST_REMINDER_TO manquant — ajoute par ex. TEST_REMINDER_TO=moi@gmail.com dans .env.local",
    );
    process.exit(1);
  }

  console.log("Expéditeur (from):", from);
  console.log("Destinataire (to):", to);

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: "Test PayPulss — expéditeur relances",
    text: `Test OK. Expéditeur utilisé : ${from}`,
    html: `<p>Si tu vois ce message, Resend envoie bien avec <strong>${from}</strong> comme From.</p><p>Ouvre l’email source / en-têtes pour confirmer l’expéditeur dans ton client mail.</p>`,
  });

  if (error) {
    console.error("❌ Resend:", error.message);
    process.exit(1);
  }

  console.log("✅ Envoyé — id Resend:", data?.id ?? "(null)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
