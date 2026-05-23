"use client";

import { useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  attachmentLimitLabel,
  formatAttachmentBytes,
  type ReminderTemplateAttachmentMeta,
} from "@/lib/reminder-template-attachment";
import { getReminderAttachmentMaxBytes } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

type Labels = {
  title: string;
  choose: string;
  replace: string;
  remove: string;
  uploading: string;
  none: string;
  attached: (name: string, size: string) => string;
};

export function TemplateAttachmentField({
  supabase,
  workspaceId,
  daysAfterDue,
  planId,
  locale,
  labels,
  disabled,
  value,
  onChange,
  onError,
}: {
  supabase: SupabaseClient;
  workspaceId: string;
  daysAfterDue: number;
  planId: PlanId;
  locale: string;
  labels: Labels;
  disabled: boolean;
  value: ReminderTemplateAttachmentMeta | null;
  onChange: (next: ReminderTemplateAttachmentMeta | null) => void;
  onError: (msg: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const maxBytes = getReminderAttachmentMaxBytes(planId);

  async function authHeaders(): Promise<HeadersInit> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error(locale === "fr" ? "Session expirée." : "Session expired.");
    return { Authorization: `Bearer ${token}` };
  }

  async function removeRemote(path: string) {
    const headers = await authHeaders();
    await fetch("/api/reminder-template-attachment", {
      method: "DELETE",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ storagePath: path }),
    });
  }

  async function onPick(file: File | null) {
    if (!file || disabled) return;
    onError(null);

    if (file.size > maxBytes) {
      onError(
        locale === "fr"
          ? `Fichier trop volumineux (max. ${formatAttachmentBytes(maxBytes, locale)}).`
          : `File too large (max. ${formatAttachmentBytes(maxBytes, locale)}).`,
      );
      return;
    }

    setUploading(true);
    try {
      if (value?.storagePath) {
        try {
          await removeRemote(value.storagePath);
        } catch {
          /* remplacement : ancien fichier ignoré si suppression échoue */
        }
      }

      const headers = await authHeaders();
      const form = new FormData();
      form.set("file", file);
      form.set("workspaceId", workspaceId);
      form.set("daysAfterDue", String(daysAfterDue));

      const res = await fetch("/api/reminder-template-attachment", {
        method: "POST",
        headers,
        body: form,
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        storagePath?: string;
        fileName?: string;
        contentType?: string;
        sizeBytes?: number;
      };

      if (!res.ok || !json.ok || !json.storagePath || !json.fileName) {
        onError(json.error ?? (locale === "fr" ? "Échec de l’envoi du fichier." : "Upload failed."));
        return;
      }

      onChange({
        storagePath: json.storagePath,
        fileName: json.fileName,
        contentType: json.contentType ?? file.type,
        sizeBytes: json.sizeBytes ?? file.size,
      });
    } catch (e) {
      onError(e instanceof Error ? e.message : locale === "fr" ? "Échec de l’envoi." : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (disabled || !value) return;
    onError(null);
    setUploading(true);
    try {
      await removeRemote(value.storagePath);
      onChange(null);
    } catch (e) {
      onError(e instanceof Error ? e.message : locale === "fr" ? "Suppression impossible." : "Could not remove.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-dashed border-slate-200 bg-white px-3 py-3">
      <p className="text-xs font-medium text-slate-600">{labels.title}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{attachmentLimitLabel(planId, locale)}</p>

      {value ? (
        <p className="mt-2 text-xs text-slate-700">
          {labels.attached(value.fileName, formatAttachmentBytes(value.sizeBytes, locale))}
        </p>
      ) : (
        <p className="mt-2 text-xs text-slate-500">{labels.none}</p>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
        >
          {uploading ? labels.uploading : value ? labels.replace : labels.choose}
        </button>
        {value ? (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => void handleRemove()}
            className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {labels.remove}
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,image/jpeg,image/png,image/webp,image/gif,application/pdf"
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
