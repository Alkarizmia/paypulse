/** Journalisation structurée côté route handler — évite de tracer e-mails/contenu dans les chaînes. */

export type ServerLogFields = Record<string, string | number | boolean | null | undefined>;

export function serverStructuredLog(topic: string, fields: ServerLogFields = {}) {
  const payload = {
    ts: new Date().toISOString(),
    topic,
    ...fields,
  };
  console.log(JSON.stringify(payload));
}
