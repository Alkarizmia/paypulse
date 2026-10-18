import { getSupabaseServerClient } from "@/lib/server-supabase";

export type AdminPeriod = "24h" | "7d" | "30d" | "all";

export type FunnelStep = {
  key: "cta_click" | "modal_open" | "email_focus" | "signup_success";
  label: string;
  count: number;
  fromPrevPct: number | null;
};

export type BreakdownRow = {
  key: string;
  modalOpen: number;
  signupSuccess: number;
  conversionPct: number | null;
};

export type CtaRow = {
  location: string;
  clicks: number;
  modalOpen: number;
  openPct: number | null;
};

export type DayBar = {
  day: string;
  count: number;
};

export type RecentSignup = {
  maskedEmail: string;
  langue: string;
  source: string;
  createdAt: string;
};

export type AdminDashboardData = {
  totals: {
    all: number;
    today: number;
    last7d: number;
  };
  period: AdminPeriod;
  funnel: FunnelStep[];
  abandonedModal: { count: number; pct: number | null };
  signupErrors: number;
  bySource: BreakdownRow[];
  byLang: BreakdownRow[];
  byCta: CtaRow[];
  dailySignups: DayBar[];
  recent: RecentSignup[];
  sampleTooSmall: boolean;
};

const FUNNEL_ORDER = ["cta_click", "modal_open", "email_focus", "signup_success"] as const;

const FUNNEL_LABELS: Record<(typeof FUNNEL_ORDER)[number], string> = {
  cta_click: "Clic CTA",
  modal_open: "Ouverture modale",
  email_focus: "Focus email",
  signup_success: "Inscription",
};

export function parseAdminPeriod(raw: string | null | undefined): AdminPeriod {
  if (raw === "24h" || raw === "7d" || raw === "30d" || raw === "all") return raw;
  return "7d";
}

function periodStart(period: AdminPeriod): Date | null {
  const now = Date.now();
  switch (period) {
    case "24h":
      return new Date(now - 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case "30d":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

function pct(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Math.round((num / den) * 1000) / 10;
}

export function maskEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "***";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const first = local.charAt(0) || "*";
  return `${first}***@${domain}`;
}

type EventRow = {
  event: string;
  location: string | null;
  source: string | null;
  lang: string | null;
  created_at: string;
};

type WaitlistRow = {
  email: string;
  langue: string | null;
  source: string | null;
  created_at: string;
};

export async function loadAdminDashboardData(period: AdminPeriod): Promise<AdminDashboardData | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase.ok) return null;

  const start = periodStart(period);
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  let eventsQuery = supabase.client
    .from("waitlist_events")
    .select("event, location, source, lang, created_at");
  if (start) {
    eventsQuery = eventsQuery.gte("created_at", start.toISOString());
  }

  const [eventsRes, waitlistAllRes, waitlistRecentRes, waitlistDailyRes] = await Promise.all([
    eventsQuery.limit(50000),
    supabase.client.from("waitlist").select("id", { count: "exact", head: true }),
    supabase.client
      .from("waitlist")
      .select("email, langue, source, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.client
      .from("waitlist")
      .select("created_at")
      .gte("created_at", fourteenDaysAgo.toISOString()),
  ]);

  const events = (eventsRes.data ?? []) as EventRow[];
  const recentRows = (waitlistRecentRes.data ?? []) as WaitlistRow[];
  const dailyRows = (waitlistDailyRes.data ?? []) as { created_at: string }[];

  const waitlistTodayRes = await supabase.client
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfToday.toISOString());
  const waitlist7Res = await supabase.client
    .from("waitlist")
    .select("id", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString());

  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.event] = (counts[e.event] ?? 0) + 1;
  }

  const funnel: FunnelStep[] = FUNNEL_ORDER.map((key, i) => {
    const count = counts[key] ?? 0;
    const prev = i === 0 ? null : (counts[FUNNEL_ORDER[i - 1]] ?? 0);
    return {
      key,
      label: FUNNEL_LABELS[key],
      count,
      fromPrevPct: prev === null ? null : pct(count, prev),
    };
  });

  const modalOpen = counts.modal_open ?? 0;
  const signupSuccess = counts.signup_success ?? 0;
  const abandoned = Math.max(0, modalOpen - signupSuccess);

  const bySourceMap = new Map<string, { modalOpen: number; signupSuccess: number }>();
  const byLangMap = new Map<string, { modalOpen: number; signupSuccess: number }>();
  const byCtaMap = new Map<string, { clicks: number; modalOpen: number }>();

  for (const e of events) {
    const src = (e.source && e.source.trim()) || "direct";
    const lang = (e.lang && e.lang.trim()) || "—";

    if (e.event === "modal_open" || e.event === "signup_success") {
      const s = bySourceMap.get(src) ?? { modalOpen: 0, signupSuccess: 0 };
      if (e.event === "modal_open") s.modalOpen += 1;
      else s.signupSuccess += 1;
      bySourceMap.set(src, s);

      const l = byLangMap.get(lang) ?? { modalOpen: 0, signupSuccess: 0 };
      if (e.event === "modal_open") l.modalOpen += 1;
      else l.signupSuccess += 1;
      byLangMap.set(lang, l);
    }

    if (e.event === "cta_click") {
      const loc = e.location || "—";
      const c = byCtaMap.get(loc) ?? { clicks: 0, modalOpen: 0 };
      c.clicks += 1;
      byCtaMap.set(loc, c);
    }
  }

  // Approx: modal opens attributed to last CTA location aren't available anonymously.
  // Show CTA clicks; open rate vs total modal_open is not per-location without session.
  // Spec: "Par emplacement du CTA : clics et taux d'ouverture de modale."
  // Without visitor id we can't join. Proxy: for each location, openPct = null if we can't,
  // OR count modal_open that have same location field if we also send location on modal_open.
  // We'll send location on modal_open from client when known.

  for (const e of events) {
    if (e.event === "modal_open" && e.location) {
      const c = byCtaMap.get(e.location) ?? { clicks: 0, modalOpen: 0 };
      c.modalOpen += 1;
      byCtaMap.set(e.location, c);
    }
  }

  function toBreakdown(map: Map<string, { modalOpen: number; signupSuccess: number }>): BreakdownRow[] {
    return [...map.entries()]
      .map(([key, v]) => ({
        key,
        modalOpen: v.modalOpen,
        signupSuccess: v.signupSuccess,
        conversionPct: pct(v.signupSuccess, v.modalOpen),
      }))
      .sort((a, b) => b.modalOpen - a.modalOpen);
  }

  const byCta: CtaRow[] = [...byCtaMap.entries()]
    .map(([location, v]) => ({
      location,
      clicks: v.clicks,
      modalOpen: v.modalOpen,
      openPct: pct(v.modalOpen, v.clicks),
    }))
    .sort((a, b) => b.clicks - a.clicks);

  const dayCounts = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    dayCounts.set(key, 0);
  }
  for (const row of dailyRows) {
    const key = row.created_at.slice(0, 10);
    if (dayCounts.has(key)) {
      dayCounts.set(key, (dayCounts.get(key) ?? 0) + 1);
    }
  }
  const dailySignups: DayBar[] = [...dayCounts.entries()].map(([day, count]) => ({ day, count }));

  const sampleTooSmall = events.length < 30;

  return {
    totals: {
      all: waitlistAllRes.count ?? 0,
      today: waitlistTodayRes.count ?? 0,
      last7d: waitlist7Res.count ?? 0,
    },
    period,
    funnel,
    abandonedModal: {
      count: abandoned,
      pct: pct(abandoned, modalOpen),
    },
    signupErrors: counts.signup_error ?? 0,
    bySource: toBreakdown(bySourceMap),
    byLang: toBreakdown(byLangMap),
    byCta,
    dailySignups,
    recent: recentRows.map((r) => ({
      maskedEmail: maskEmail(r.email),
      langue: r.langue || "—",
      source: r.source || "direct",
      createdAt: r.created_at,
    })),
    sampleTooSmall,
  };
}

export async function loadWaitlistExportRows(): Promise<
  { email: string; langue: string; source: string; created_at: string }[] | null
> {
  const supabase = getSupabaseServerClient();
  if (!supabase.ok) return null;

  const { data, error } = await supabase.client
    .from("waitlist")
    .select("email, langue, source, created_at")
    .order("created_at", { ascending: false })
    .limit(10000);

  if (error) return null;
  return (data ?? []).map((r) => ({
    email: String(r.email ?? ""),
    langue: String(r.langue ?? ""),
    source: String(r.source ?? ""),
    created_at: String(r.created_at ?? ""),
  }));
}
