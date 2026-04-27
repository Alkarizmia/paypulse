import { NextResponse } from "next/server";
import { type ReminderDraftTone, parseReminderDraftTone } from "@/lib/reminder-draft-tone";

export type ReminderDraftAiRequest = {
  locale?: "fr" | "en";
  senderCompany?: string;
  invoiceRef?: string;
  amountHint?: string;
  daysAfterDue?: number;
  /** Ton prédéfini (pas de texte libre — voir `lib/reminder-draft-tone.ts`). */
  tone?: ReminderDraftTone;
};

export type ReminderDraftAiResponse = {
  subject: string;
  body: string;
  warning?: string;
};

function heuristicDraft(input: Required<Pick<ReminderDraftAiRequest, "locale">> & ReminderDraftAiRequest): ReminderDraftAiResponse {
  const { locale } = input;
  const company = input.senderCompany?.trim();
  const ref = input.invoiceRef?.trim();
  const amount = input.amountHint?.trim();
  const days = typeof input.daysAfterDue === "number" && Number.isFinite(input.daysAfterDue) ? input.daysAfterDue : undefined;
  const tone = input.tone ?? "neutral";

  const missingFr: string[] = [];
  const missingEn: string[] = [];
  if (!company) {
    missingFr.push("le nom de votre entreprise / signature");
    missingEn.push("your company or sender name");
  }
  if (!ref) {
    missingFr.push("une référence ou un libellé de facture");
    missingEn.push("an invoice reference or label");
  }
  const warning =
    missingFr.length > 0
      ? locale === "fr"
        ? `Pour un texte plus précis, complétez notamment : ${missingFr.join(", ")}. Voici tout de même une proposition générique.`
        : `For a sharper message, add: ${missingEn.join(", ")}. Here is a generic draft anyway.`
      : undefined;

  const refLine = ref ?? (locale === "fr" ? "notre facture" : "our invoice");
  const delay =
    days != null
      ? locale === "fr"
        ? ` (relance environ J+${days} après échéance)`
        : ` (follow-up around D+${days} after due date)`
      : "";

  const amountLineFr =
    amount != null
      ? `Montant concerné : ${amount}.\n\n`
      : "";
  const amountLineEn = amount != null ? `Amount: ${amount}.\n\n` : "";

  if (locale === "fr") {
    const blocks: Record<ReminderDraftTone, { subject: string; bodyLines: string[]; closings: [string, string] }> = {
      neutral: {
        subject: ref ? `Relance — ${refLine}` : "Relance — facture en attente de règlement",
        bodyLines: [
          `${amountLineFr}Je me permets de revenir vers vous concernant ${refLine}${delay}.`,
          "Pourriez-vous nous confirmer la date de règlement ou nous indiquer si un point bloque encore de votre côté ?",
        ],
        closings: ["Cordialement,", company ?? "Votre contact"],
      },
      gentle: {
        subject: ref ? `Petit rappel amical — ${refLine}` : "Petit rappel amical — facture en attente",
        bodyLines: [
          `${amountLineFr}J’aimerais simplement revenir vers vous, avec toute notre considération, concernant ${refLine}${delay}.`,
          "N’hésitez pas à nous indiquer la date prévue de règlement ou toute information utile de votre côté.",
        ],
        closings: ["Bien à vous,", company ?? "Votre contact"],
      },
      firm: {
        subject: ref ? `Relance — règlement requis — ${refLine}` : "Relance — règlement requis",
        bodyLines: [
          `${amountLineFr}Nous revenons vers vous concernant ${refLine}${delay} et avons besoin d’une date de règlement concrète.`,
          "Merci de nous confirmer sous 48 h le règlement ou de signaler toute difficulté spécifique.",
        ],
        closings: ["Cordialement,", company ?? "Votre contact"],
      },
      urgent: {
        subject: ref ? `URGENT — facture en retard — ${refLine}` : "URGENT — facture en attente de règlement",
        bodyLines: [
          `${amountLineFr}Nous attirons votre attention sur l’échéance de la facture ${refLine}${delay} et l’importance d’un règlement prochain.`,
          "Merci de procéder au paiement dans les plus brefs délais ou de nous contacter en urgence en cas d’empêchement.",
        ],
        closings: ["Cordialement,", company ?? "Votre contact"],
      },
    };
    const b = blocks[tone] ?? blocks.neutral;
    return {
      subject: b.subject,
      body: ["Bonjour,", "", ...b.bodyLines, "", ...b.closings].join("\n"),
      warning,
    };
  }

  const blocksEn: Record<ReminderDraftTone, { subject: string; bodyLines: string[]; closings: [string, string] }> = {
    neutral: {
      subject: ref ? `Follow-up — ${refLine}` : "Follow-up — outstanding invoice",
      bodyLines: [
        `${amountLineEn}I'm following up on ${refLine}${delay}.`,
        "Could you confirm when we can expect payment, or let us know if anything is still pending on your side?",
      ],
      closings: ["Best regards,", company ?? "Your contact"],
    },
    gentle: {
      subject: ref ? `Friendly nudge — ${refLine}` : "Friendly nudge — outstanding invoice",
      bodyLines: [
        `${amountLineEn}I'm reaching out in a friendly way about ${refLine}${delay}.`,
        "If you can share the expected payment date or any context on your side, we'd really appreciate it.",
      ],
      closings: ["Warm regards,", company ?? "Your contact"],
    },
    firm: {
      subject: ref ? `Payment required — follow-up — ${refLine}` : "Payment required — follow-up",
      bodyLines: [
        `${amountLineEn}We need a concrete payment date for ${refLine}${delay}.`,
        "Please confirm payment within 48 hours or let us know if a specific issue is holding this up.",
      ],
      closings: ["Regards,", company ?? "Your contact"],
    },
    urgent: {
      subject: ref ? `URGENT — unpaid invoice — ${refLine}` : "URGENT — outstanding invoice",
      bodyLines: [
        `${amountLineEn}We need to highlight the due date of invoice ${refLine}${delay} and the urgency of resolving this.`,
        "Please arrange payment as soon as possible, or contact us urgently if you cannot.",
      ],
      closings: ["Regards,", company ?? "Your contact"],
    },
  };
  const be = blocksEn[tone] ?? blocksEn.neutral;
  return {
    subject: be.subject,
    body: ["Hi,", "", ...be.bodyLines, "", ...be.closings].join("\n"),
    warning,
  };
}

function openAiToneDirective(locale: "fr" | "en", tone: ReminderDraftTone): string {
  if (locale === "fr") {
    switch (tone) {
      case "gentle":
        return "Style à appliquer : ton chaleureux, bienveillant, phrasing doux et rassurant, sans agressivité. Ne mentionne jamais le mot « ton ».";
      case "firm":
        return "Style à appliquer : ferme, clair, direct, mais poli. Insister sur l’action attendue (date ou réponse) sans emojis ni familiarité excessive.";
      case "urgent":
        return "Style à appliquer : sérieux, insistant, souligner l’urgence du règlement, rester professionnel. Pas de chantage ni d’intimidation.";
      default:
        return "Style à appliquer : professionnel, neutre, relance de routine, courtois et concis.";
    }
  }
  switch (tone) {
    case "gentle":
      return "Apply style: warm, kind, soft wording, not pushy. Never mention the word 'tone'.";
    case "firm":
      return "Apply style: firm, clear, and polite; stress the need for a concrete next step. No emojis, no casual slang.";
    case "urgent":
      return "Apply style: serious and urgent, emphasize timely payment, remain professional. No threats.";
    default:
      return "Apply style: professional, standard follow-up, courteous and brief.";
  }
}

async function openAiDraft(input: ReminderDraftAiRequest): Promise<ReminderDraftAiResponse | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const locale = input.locale === "en" ? "en" : "fr";
  const tone = parseReminderDraftTone(input.tone);
  const system =
    locale === "fr"
      ? "Tu rédiges des relances professionnelles courtes pour recouvrer des factures. " +
        "Ne mets AUCUNE ligne du type « Ton : », « Ton souhaité » ou autre mention de paramètre : seule l’e-mail final est visible par le client. " +
        "Réponds uniquement en JSON compact : {\"subject\":\"...\",\"body\":\"...\"} sans markdown. La signature (nom) utilise senderCompany si fourni."
      : "You write short professional payment reminder emails. " +
        "NEVER include meta lines like 'Tone:' or parameter labels in the message body -- only the final client-facing email. " +
        "Reply with compact JSON only: {\"subject\":\"...\",\"body\":\"...\"} no markdown. Use senderCompany in the sign-off if provided.";

  const userPayload = {
    locale,
    senderCompany: input.senderCompany ?? "",
    invoiceRef: input.invoiceRef ?? "",
    amountHint: input.amountHint ?? "",
    daysAfterDue: input.daysAfterDue ?? null,
    tone,
  };

  const styleBlock = openAiToneDirective(locale, tone);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_REMINDER_MODEL ?? "gpt-4o-mini",
      temperature: 0.65,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: `${styleBlock}\n\nContexte (champs vides = générique) : ${JSON.stringify(userPayload)}`,
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = data.choices?.[0]?.message?.content?.trim();
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    const parsed = JSON.parse(cleaned) as { subject?: string; body?: string };
    const subject = typeof parsed.subject === "string" ? parsed.subject.trim() : "";
    const body = typeof parsed.body === "string" ? parsed.body.trim() : "";
    if (!subject || !body) return null;
    const h = heuristicDraft({ ...input, locale });
    return { subject, body, warning: h.warning };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as ReminderDraftAiRequest;
    const locale = raw.locale === "en" ? "en" : "fr";
    const input: ReminderDraftAiRequest = {
      ...raw,
      locale,
      tone: parseReminderDraftTone(raw.tone),
    };

    const fromOpenAi = await openAiDraft({ ...input, locale });
    if (fromOpenAi) {
      return NextResponse.json(fromOpenAi);
    }

    const out = heuristicDraft({ ...input, locale, tone: input.tone ?? "neutral" });
    return NextResponse.json(out);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
