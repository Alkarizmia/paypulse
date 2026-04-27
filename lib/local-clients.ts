import type { Client, ClientPaidEvent, ClientStatus } from "@/app/dashboard/types";

const STORAGE_V1 = "paypulse_clients_v1";
const STORAGE_V2 = "paypulse_clients_v2";

function isClientStatus(v: unknown): v is ClientStatus {
  return v === "paid" || v === "unpaid";
}

function parsePaidEventsField(raw: unknown): ClientPaidEvent[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: ClientPaidEvent[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const at = typeof o.at === "string" ? o.at : null;
    const amt = typeof o.amount === "number" ? o.amount : Number(o.amount);
    if (at && Number.isFinite(amt)) out.push({ at, amount: amt });
  }
  return out.length ? out : undefined;
}

function parseClient(raw: unknown): Client | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = typeof o.id === "string" ? o.id : null;
  const name = typeof o.name === "string" ? o.name : null;
  const companyName = typeof o.companyName === "string" ? o.companyName : undefined;
  const email = typeof o.email === "string" ? o.email : null;
  const amountDue = typeof o.amountDue === "number" ? o.amountDue : Number(o.amountDue);
  const dueDate = typeof o.dueDate === "string" ? o.dueDate : null;
  const status = o.status;
  const createdAt = typeof o.createdAt === "string" ? o.createdAt : undefined;
  const paidAt =
    o.paidAt === undefined ? undefined : typeof o.paidAt === "string" ? o.paidAt : o.paidAt === null ? null : undefined;
  const deletedAt =
    o.deletedAt === undefined ? undefined : typeof o.deletedAt === "string" ? o.deletedAt : o.deletedAt === null ? null : undefined;
  const paidEvents = parsePaidEventsField(o.paidEvents);
  if (!id || !name || !email || !dueDate || !isClientStatus(status) || !Number.isFinite(amountDue)) {
    return null;
  }
  return {
    id,
    name,
    companyName,
    email,
    amountDue,
    dueDate,
    status,
    createdAt,
    paidAt,
    deletedAt,
    paidEvents,
  };
}

function migrateV1ToV2(): Client[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_V1);
    if (!raw) return [];
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    const now = new Date().toISOString();
    return data
      .map(parseClient)
      .filter((c): c is Client => c !== null)
      .map((c) => ({
        ...c,
        createdAt: c.createdAt ?? now,
        paidAt: c.status === "paid" ? (c.paidAt ?? now) : null,
        deletedAt: null,
        paidEvents:
          c.paidEvents ??
          (c.status === "paid" ? [{ at: c.paidAt ?? now, amount: c.amountDue }] : undefined),
      }));
  } catch {
    return [];
  }
}

/** Toutes les lignes (actives + corbeille). */
export function loadLocalClientStore(): Client[] {
  if (typeof window === "undefined") return [];
  try {
    const rawV2 = window.localStorage.getItem(STORAGE_V2);
    if (rawV2) {
      const data = JSON.parse(rawV2) as unknown;
      if (!Array.isArray(data)) return [];
      return data.map(parseClient).filter((c): c is Client => c !== null);
    }
    const migrated = migrateV1ToV2();
    if (migrated.length) {
      window.localStorage.setItem(STORAGE_V2, JSON.stringify(migrated));
      window.localStorage.removeItem(STORAGE_V1);
    }
    return migrated;
  } catch {
    return [];
  }
}

export function saveLocalClientStore(clients: Client[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_V2, JSON.stringify(clients));
  } catch {
    // ignore
  }
}

export function getActiveLocalClients(): Client[] {
  return loadLocalClientStore().filter((c) => !c.deletedAt);
}

export function getTrashedLocalClients(): Client[] {
  return loadLocalClientStore().filter((c) => Boolean(c.deletedAt));
}

/** @deprecated utiliser getActiveLocalClients */
export function loadLocalClients(): Client[] {
  return getActiveLocalClients();
}

/** @deprecated utiliser saveLocalClientStore avec le store complet */
export function saveLocalClients(activeClients: Client[]): void {
  const trash = getTrashedLocalClients();
  saveLocalClientStore([...activeClients, ...trash]);
}

export function replaceLocalClientById(clientId: string, patch: Partial<Client>): void {
  const all = loadLocalClientStore();
  const next = all.map((c) => (c.id === clientId ? { ...c, ...patch } : c));
  saveLocalClientStore(next);
}

export function appendLocalClient(client: Client): void {
  saveLocalClientStore([client, ...loadLocalClientStore()]);
}

export function removeLocalClientById(clientId: string): void {
  saveLocalClientStore(loadLocalClientStore().filter((c) => c.id !== clientId));
}
