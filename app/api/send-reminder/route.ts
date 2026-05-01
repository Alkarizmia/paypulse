import { NextResponse } from "next/server";
import { Resend } from "resend";

type ReminderRequest = {
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
};

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "Missing RESEND_API_KEY." }, { status: 500 });
  }
  if (!from) {
    return NextResponse.json({ ok: false, error: "Missing MAIL_FROM." }, { status: 500 });
  }

  let payload: ReminderRequest;
  try {
    payload = (await request.json()) as ReminderRequest;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const to = typeof payload.to === "string" ? normalizeEmail(payload.to) : "";
  const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
  const html = typeof payload.html === "string" ? payload.html.trim() : "";
  const text = typeof payload.text === "string" ? payload.text.trim() : "";

  if (!to || !subject || (!html && !text)) {
    return NextResponse.json(
      { ok: false, error: "Required fields: to, subject, and html or text." },
      { status: 400 },
    );
  }

  const resend = new Resend(apiKey);
  const message = {
    from,
    to,
    subject,
    text: text || " ",
    ...(html ? { html } : {}),
  } as const;
  const { data, error } = await resend.emails.send(message);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data?.id ?? null });
}
