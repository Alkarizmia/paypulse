/**
 * Déclenche localement (ou en prod) GET /api/reminders/run comme le cron Vercel.
 *
 * Usage :
 *   npm run reminders:run
 *
 * Prérequis dans .env.local (ou l’environnement) :
 *   CRON_SECRET=...
 * Optionnel :
 *   REMINDERS_RUN_URL=http://localhost:3000   (défaut)
 */

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", ".env.local") });

const baseUrl = (process.env.REMINDERS_RUN_URL ?? "http://localhost:3000").replace(/\/$/, "");
const secret = process.env.CRON_SECRET?.trim();

if (!secret) {
  console.error("❌ CRON_SECRET manquant dans .env.local");
  process.exit(1);
}

const url = `${baseUrl}/api/reminders/run`;

async function main() {
  console.log("→", url);
  const res = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }

  if (!res.ok) {
    console.error("❌ HTTP", res.status, text);
    process.exit(1);
  }

  console.log(JSON.stringify(json ?? text, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
