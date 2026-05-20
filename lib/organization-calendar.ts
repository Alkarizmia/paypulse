import type { Client } from "@/app/dashboard/types";
import { getClientReminderSentAt } from "@/lib/client-reminder-track";

export type CalendarEventKind = "due" | "payment" | "reminder_sent" | "reminder_planned" | "custom";

export type CalendarEvent = {
  id: string;
  date: string;
  kind: CalendarEventKind;
  title: string;
  subtitle?: string;
  amountEur?: number;
  clientId?: string;
};

export type CustomCalendarEvent = {
  id: string;
  date: string;
  title: string;
  note?: string;
};

const STORAGE_PREFIX = "paypulss_org_calendar_v1:";

function storageKey(userId: string, workspaceId: string | null): string {
  return `${STORAGE_PREFIX}${userId}:${workspaceId ?? "default"}`;
}

export function readCustomCalendarEvents(userId: string, workspaceId: string | null): CustomCalendarEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(userId, workspaceId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is CustomCalendarEvent =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as CustomCalendarEvent).id === "string" &&
        typeof (e as CustomCalendarEvent).date === "string" &&
        typeof (e as CustomCalendarEvent).title === "string",
    );
  } catch {
    return [];
  }
}

export function writeCustomCalendarEvents(
  userId: string,
  workspaceId: string | null,
  events: CustomCalendarEvent[],
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId, workspaceId), JSON.stringify(events));
  } catch {
    /* ignore */
  }
}

export function addCustomCalendarEvent(
  userId: string,
  workspaceId: string | null,
  input: { date: string; title: string; note?: string },
): CustomCalendarEvent {
  const list = readCustomCalendarEvents(userId, workspaceId);
  const ev: CustomCalendarEvent = {
    id: `c-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    date: input.date,
    title: input.title.trim(),
    note: input.note?.trim() || undefined,
  };
  writeCustomCalendarEvents(userId, workspaceId, [...list, ev]);
  return ev;
}

export function removeCustomCalendarEvent(userId: string, workspaceId: string | null, id: string): void {
  const list = readCustomCalendarEvents(userId, workspaceId).filter((e) => e.id !== id);
  writeCustomCalendarEvents(userId, workspaceId, list);
}

function ymdFromIso(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysYmd(ymd: string, days: number): string {
  const d = new Date(ymd + "T12:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isOverdueYmd(dueYmd: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dueYmd + "T12:00:00");
  d.setHours(0, 0, 0, 0);
  return d < today;
}

export type BuildCalendarLabels = {
  due: (name: string) => string;
  payment: (name: string) => string;
  reminderSent: (name: string) => string;
  reminderPlanned: (name: string) => string;
};

export function buildCalendarEventsFromClients(
  clients: Client[],
  labels: BuildCalendarLabels,
  options?: { includePlannedReminders?: boolean; plannedDaysAfterDue?: number },
): CalendarEvent[] {
  const plannedDays = options?.plannedDaysAfterDue ?? 3;
  const includePlanned = options?.includePlannedReminders !== false;
  const out: CalendarEvent[] = [];

  for (const c of clients) {
    if (c.deletedAt) continue;
    const due = c.dueDate?.slice(0, 10);
    if (!due) continue;

    if (c.status === "unpaid") {
      out.push({
        id: `due-${c.id}`,
        date: due,
        kind: "due",
        title: labels.due(c.name),
        subtitle: c.companyName,
        amountEur: c.amountDue,
        clientId: c.id,
      });
      if (includePlanned && isOverdueYmd(due)) {
        const planned = addDaysYmd(due, plannedDays);
        out.push({
          id: `plan-${c.id}`,
          date: planned,
          kind: "reminder_planned",
          title: labels.reminderPlanned(c.name),
          subtitle: `J+${plannedDays}`,
          amountEur: c.amountDue,
          clientId: c.id,
        });
      }
    }

    const sentAt = getClientReminderSentAt(c.id);
    if (sentAt) {
      const sentDay = ymdFromIso(sentAt);
      if (sentDay) {
        out.push({
          id: `sent-${c.id}`,
          date: sentDay,
          kind: "reminder_sent",
          title: labels.reminderSent(c.name),
          clientId: c.id,
        });
      }
    }

    const paidList =
      c.paidEvents && c.paidEvents.length > 0
        ? c.paidEvents
        : c.paidAt
          ? [{ at: c.paidAt, amount: c.amountDue }]
          : [];

    for (let i = 0; i < paidList.length; i++) {
      const pe = paidList[i];
      const payDay = ymdFromIso(pe.at);
      if (!payDay) continue;
      out.push({
        id: `pay-${c.id}-${i}`,
        date: payDay,
        kind: "payment",
        title: labels.payment(c.name),
        amountEur: pe.amount,
        clientId: c.id,
      });
    }
  }

  return out;
}

export function mergeCalendarEvents(
  fromClients: CalendarEvent[],
  custom: CustomCalendarEvent[],
): CalendarEvent[] {
  const customEv: CalendarEvent[] = custom.map((e) => ({
    id: e.id,
    date: e.date,
    kind: "custom" as const,
    title: e.title,
    subtitle: e.note,
  }));
  return [...fromClients, ...customEv].sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title));
}

export function eventsOnDate(events: CalendarEvent[], ymd: string): CalendarEvent[] {
  return events.filter((e) => e.date === ymd);
}

export function eventsInMonth(events: CalendarEvent[], year: number, month: number): CalendarEvent[] {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  return events.filter((e) => e.date.startsWith(prefix));
}

export function calendarMonthMatrix(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const m = String(month + 1).padStart(2, "0");
    const day = String(d).padStart(2, "0");
    cells.push(`${year}-${m}-${day}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

export function todayYmd(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
