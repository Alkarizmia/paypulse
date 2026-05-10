import type { DashboardNotification } from "@/lib/notifications";

function utcDayDiff(fromIsoDay: string): number {
  const [y, m, d] = fromIsoDay.split("-").map((x) => Number(x));
  if (!y || !m || !d) return 0;
  const dueUtc = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.max(0, Math.floor((todayUtc - dueUtc) / 86_400_000));
}

/** Libellés cohérents (FR/EN) à partir du type + payload, sans dépendre du texte stocké en base. */
export function formatDashboardNotificationCopy(
  n: DashboardNotification,
  locale: "fr" | "en",
): { title: string; body: string } {
  const p = n.payload ?? {};
  const str = (k: string) => (typeof p[k] === "string" ? (p[k] as string).trim() : "");

  if (n.type === "overdue_detected") {
    const name =
      str("clientName") ||
      (n.body.includes(" — ") ? n.body.split(" — ")[0]?.trim() : "") ||
      n.body.split(/ a depasse /i)[0]?.trim() ||
      n.body.split(/ a dépassé /i)[0]?.trim() ||
      "—";
    const due = str("dueDate");
    const email = str("email");
    const days = due ? utcDayDiff(due) : 0;
    if (locale === "fr") {
      const delay =
        days <= 0 ? "La date d’échéance est atteinte ou dépassée." : `Retard : ${days} jour${days > 1 ? "s" : ""}.`;
      const contact = email ? ` Contact : ${email}.` : "";
      return {
        title: "Échéance dépassée",
        body: `${name} — échéance du ${due || "?"}.${delay}${contact}`,
      };
    }
    const delay =
      days <= 0 ? "The due date is reached or past." : `${days} day${days === 1 ? "" : "s"} overdue.`;
    const contact = email ? ` Contact: ${email}.` : "";
    return {
      title: "Due date passed",
      body: `${name} — due ${due || "?"}. ${delay}${contact}`,
    };
  }

  if (n.type === "reminder_sent") {
    const to = str("email");
    const clientName = str("clientName");
    const sd = typeof p.scheduleDays === "number" ? p.scheduleDays : Number(p.scheduleDays);
    const j = Number.isFinite(sd) ? sd : "?";
    if (locale === "fr") {
      return {
        title: `Relance envoyée (J+${j})`,
        body: `E-mail de relance envoyé à ${to || "?"}.${clientName ? ` Client : ${clientName}.` : ""}`,
      };
    }
    return {
      title: `Reminder sent (day +${j})`,
      body: `Reminder email sent to ${to || "?"}.${clientName ? ` Client: ${clientName}.` : ""}`,
    };
  }

  if (n.type === "reminder_stage") {
    const clientName = str("clientName") || str("email");
    const stage = str("stage") || `J+${typeof p.scheduleDays === "number" ? p.scheduleDays : "?"}`;
    if (locale === "fr") {
      return {
        title: "Palier de relance",
        body: `Passage au palier ${stage}${clientName ? ` pour ${clientName}.` : "."}`,
      };
    }
    return {
      title: "Reminder milestone",
      body: `Moved to ${stage}${clientName ? ` for ${clientName}.` : "."}`,
    };
  }

  return { title: n.title, body: n.body };
}
