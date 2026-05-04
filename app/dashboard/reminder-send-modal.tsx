"use client";

import { useEffect, useState } from "react";

export type ReminderSendModalLabels = {
  title: string;
  recipient: string;
  subject: string;
  body: string;
  cancel: string;
  send: string;
  sending: string;
  subjectRequired: string;
};

type ReminderSendModalProps = {
  open: boolean;
  recipientEmail: string;
  initialSubject: string;
  initialBody: string;
  labels: ReminderSendModalLabels;
  onClose: () => void;
  /** Called on confirm; should throw or reject on failure so the modal stays open. */
  onSend: (payload: { subject: string; body: string }) => Promise<void>;
};

export function ReminderSendModal({
  open,
  recipientEmail,
  initialSubject,
  initialBody,
  labels,
  onClose,
  onSend,
}: ReminderSendModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSubject(initialSubject);
    setBody(initialBody);
    setFormError(null);
    setSubmitting(false);
  }, [open, initialSubject, initialBody]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, submitting]);

  if (!open) return null;

  async function submit() {
    const s = subject.trim();
    if (!s) {
      setFormError(labels.subjectRequired);
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await onSend({ subject: s, body: body });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-send-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        aria-label={labels.cancel}
        disabled={submitting}
        onClick={() => {
          if (!submitting) onClose();
        }}
      />
      <div className="relative z-[101] flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col rounded-2xl border border-white/[0.12] bg-[#16161f] shadow-2xl shadow-black/50">
        <div className="border-b border-white/[0.06] p-5 sm:p-6">
          <h2 id="reminder-send-title" className="text-lg font-semibold text-white">
            {labels.title}
          </h2>
          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{labels.recipient}</p>
            <p className="mt-1.5 break-all rounded-lg border border-white/[0.08] bg-[#0f0f14] px-3 py-2 text-sm text-slate-300">
              {recipientEmail}
            </p>
          </div>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6 sm:pt-4">
          <div>
            <label htmlFor="reminder-subject" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              {labels.subject}
            </label>
            <input
              id="reminder-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={submitting}
              className="mt-1.5 w-full rounded-lg border border-white/[0.1] bg-[#0f0f14] px-3 py-2.5 text-sm text-white outline-none ring-violet-500/30 placeholder:text-slate-600 focus:border-violet-500/50 focus:ring-2"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="reminder-body" className="block text-xs font-medium uppercase tracking-wide text-slate-500">
              {labels.body}
            </label>
            <textarea
              id="reminder-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={submitting}
              rows={12}
              className="mt-1.5 w-full resize-y rounded-lg border border-white/[0.1] bg-[#0f0f14] px-3 py-2.5 text-sm leading-relaxed text-white outline-none ring-violet-500/30 placeholder:text-slate-600 focus:border-violet-500/50 focus:ring-2"
            />
          </div>
          {formError ? <p className="text-sm text-rose-400">{formError}</p> : null}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-white/[0.06] p-5 sm:p-6 sm:pt-4">
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {labels.cancel}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="rounded-lg border border-violet-500/40 bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-violet-900/30 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            {submitting ? labels.sending : labels.send}
          </button>
        </div>
      </div>
    </div>
  );
}
