import type { SupabaseClient } from "@supabase/supabase-js";
import type { Client, ClientPaidEvent, ClientStatus } from "@/app/dashboard/types";

type ClientRow = {
  id: string;
  name: string;
  company_name: string | null;
  domain: string | null;
  phone: string | null;
  email: string;
  amount_due: number | string;
  due_date: string;
  status: ClientStatus;
  created_at?: string;
  paid_at?: string | null;
  deleted_at?: string | null;
  paid_events?: unknown;
};

/** Retire un suffixe de cycle « x2 », « x3 » … pour retrouver le nom d’affichage de base. */
export function stripBillingCycleSuffix(name: string): string {
  const s = name.trim().replace(/\s+[xX](\d+)\s*$/i, "").trim();
  return s.length > 0 ? s : name.trim();
}

/** Nom affiché pour la nième facture du même e-mail (n ≥ 2 → « Base xn »). */
export function displayNameForInvoiceCycle(baseName: string, cycleNumber: number): string {
  const b = baseName.trim();
  if (cycleNumber <= 1) return b;
  return `${b} x${cycleNumber}`;
}

export function parsePaidEventsColumn(raw: unknown): ClientPaidEvent[] {
  if (raw == null) return [];
  let arr: unknown = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  const out: ClientPaidEvent[] = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const at = typeof o.at === "string" ? o.at : null;
    const amt = typeof o.amount === "number" ? o.amount : Number(o.amount);
    if (at && Number.isFinite(amt)) out.push({ at, amount: amt });
  }
  return out;
}

function mapRow(row: ClientRow): Client {
  const amount = typeof row.amount_due === "string" ? Number.parseFloat(row.amount_due) : row.amount_due;
  return {
    id: row.id,
    name: row.name,
    companyName: row.company_name ?? undefined,
    domain: row.domain ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email,
    amountDue: Number.isFinite(amount) ? amount : 0,
    dueDate: row.due_date,
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
    paidEvents: parsePaidEventsColumn(row.paid_events),
  };
}

const CLIENT_SELECT =
  "id,name,company_name,domain,phone,email,amount_due,due_date,status,created_at,paid_at,deleted_at,paid_events";

/** Prochaine échéance (date calendaire YYYY-MM-DD, +1 mois, garde le jour si possible). */
export function addOneMonthToIsoDate(due: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(due.trim());
  if (!m) return due;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!y || !mo || !d) return due;
  let ny = y;
  let nm = mo + 1;
  if (nm > 12) {
    nm = 1;
    ny += 1;
  }
  const lastDay = new Date(ny, nm, 0).getDate();
  const day = Math.min(d, lastDay);
  const dt = new Date(ny, nm - 1, day);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export async function fetchClients(supabase: SupabaseClient, workspaceId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select(CLIENT_SELECT)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }
  return ((data ?? []) as ClientRow[]).map(mapRow);
}

export async function fetchTrashedClients(supabase: SupabaseClient, workspaceId: string): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select(CLIENT_SELECT)
    .eq("workspace_id", workspaceId)
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  if (error) {
    throw error;
  }
  return ((data ?? []) as ClientRow[]).map(mapRow);
}

export async function insertClient(
  supabase: SupabaseClient,
  input: Omit<Client, "id"> & { userId: string; workspaceId: string },
): Promise<Client> {
  const nowIso = new Date().toISOString();
  const paidAt = input.status === "paid" ? (input.paidAt ?? nowIso) : null;
  const initialEvents: ClientPaidEvent[] =
    input.status === "paid" && paidAt ? [{ at: paidAt, amount: input.amountDue }] : [];

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name: input.name,
      company_name: input.companyName ?? null,
      domain: input.domain?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email,
      amount_due: input.amountDue,
      due_date: input.dueDate,
      status: input.status,
      user_id: input.userId,
      workspace_id: input.workspaceId,
      paid_at: paidAt,
      paid_events: initialEvents,
    })
    .select(CLIENT_SELECT)
    .single();

  if (error) {
    throw error;
  }
  return mapRow(data as ClientRow);
}

export async function softDeleteClient(supabase: SupabaseClient, clientId: string): Promise<void> {
  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("clients").update({ deleted_at: nowIso }).eq("id", clientId);
  if (error) {
    throw error;
  }
}

export async function restoreClient(supabase: SupabaseClient, clientId: string): Promise<void> {
  const { error } = await supabase.from("clients").update({ deleted_at: null }).eq("id", clientId);
  if (error) {
    throw error;
  }
}

export async function permanentDeleteClient(supabase: SupabaseClient, clientId: string): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) {
    throw error;
  }
}

/** @deprecated utiliser softDeleteClient */
export async function deleteClient(supabase: SupabaseClient, clientId: string): Promise<void> {
  await softDeleteClient(supabase, clientId);
}

/** Marque payé et enregistre un encaissement dans l’historique (graphiques / bilan). */
export async function markClientPaidWithEvent(supabase: SupabaseClient, clientId: string): Promise<Client> {
  const { data: row, error: fetchErr } = await supabase.from("clients").select(CLIENT_SELECT).eq("id", clientId).single();
  if (fetchErr) throw fetchErr;
  const r = row as ClientRow;
  const nowIso = new Date().toISOString();
  const amt = typeof r.amount_due === "string" ? Number.parseFloat(r.amount_due) : r.amount_due;
  const amount = Number.isFinite(amt) ? amt : 0;
  const prev = parsePaidEventsColumn(r.paid_events);
  const nextEvents = [...prev, { at: nowIso, amount }];

  const { data, error } = await supabase
    .from("clients")
    .update({ status: "paid" as const, paid_at: nowIso, paid_events: nextEvents })
    .eq("id", clientId)
    .select(CLIENT_SELECT)
    .single();

  if (error) throw error;
  return mapRow(data as ClientRow);
}

type ClientRowWithWorkspace = ClientRow & { user_id?: string | null; workspace_id?: string | null };

const SELECT_ADVANCE = `${CLIENT_SELECT},user_id,workspace_id`;

export type AdvanceNextCycleOverrides = {
  amountDue?: number;
  /** Date d’échéance YYYY-MM-DD pour la nouvelle ligne ; sinon +1 mois par rapport à la ligne payée. */
  dueDate?: string;
};

/**
 * Mois suivant : la ligne payée actuelle reste inchangée (historique + « Payée le »).
 * Insère une nouvelle ligne impayée (même e-mail), nom « Base x2 », « Base x3 », etc.
 * Montant et date : `overrides` ou ancien montant / échéance +1 mois.
 */
export async function advanceClientToNextInvoiceCycle(
  supabase: SupabaseClient,
  clientId: string,
  overrides?: AdvanceNextCycleOverrides,
): Promise<Client> {
  const { data: row, error: fetchErr } = await supabase.from("clients").select(SELECT_ADVANCE).eq("id", clientId).single();
  if (fetchErr) throw fetchErr;
  const r = row as ClientRowWithWorkspace;
  if (r.status !== "paid") {
    throw new Error("CLIENT_NOT_PAID");
  }
  const wsId = r.workspace_id;
  const ownerId = r.user_id;
  if (!wsId || !ownerId) {
    throw new Error("CLIENT_MISSING_WORKSPACE_OR_USER");
  }

  const emailNorm = r.email.trim();
  const { count, error: countErr } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", wsId)
    .eq("email", emailNorm)
    .is("deleted_at", null);
  if (countErr) throw countErr;

  const sameEmailRows = count ?? 0;
  const nextCycleNumber = sameEmailRows + 1;
  const baseName = stripBillingCycleSuffix(r.name);
  const nextName = displayNameForInvoiceCycle(baseName, nextCycleNumber);
  const rawOverrideDue = overrides?.dueDate?.trim();
  const nextDue =
    rawOverrideDue && /^\d{4}-\d{2}-\d{2}$/.test(rawOverrideDue) ? rawOverrideDue : addOneMonthToIsoDate(r.due_date);
  const amt = typeof r.amount_due === "string" ? Number.parseFloat(r.amount_due) : r.amount_due;
  const defaultAmount = Number.isFinite(amt) ? amt : 0;
  const amountDue =
    overrides?.amountDue !== undefined && Number.isFinite(overrides.amountDue) && overrides.amountDue >= 0
      ? overrides.amountDue
      : defaultAmount;

  return insertClient(supabase, {
    name: nextName,
    companyName: r.company_name ?? undefined,
    domain: r.domain ?? undefined,
    phone: r.phone ?? undefined,
    email: r.email,
    amountDue,
    dueDate: nextDue,
    status: "unpaid",
    userId: ownerId,
    workspaceId: wsId,
  });
}

export async function updateClientStatus(
  supabase: SupabaseClient,
  clientId: string,
  status: ClientStatus,
): Promise<Client> {
  if (status === "paid") {
    return markClientPaidWithEvent(supabase, clientId);
  }
  const patch: { status: ClientStatus; paid_at: string | null } = {
    status,
    paid_at: null,
  };

  const { data, error } = await supabase
    .from("clients")
    .update(patch)
    .eq("id", clientId)
    .select(CLIENT_SELECT)
    .single();

  if (error) {
    throw error;
  }

  return mapRow(data as ClientRow);
}
