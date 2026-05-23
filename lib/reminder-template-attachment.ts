import type { PlanId } from "@/lib/plans";
import { getReminderAttachmentMaxBytes } from "@/lib/plans";

export const REMINDER_ATTACHMENT_BUCKET = "reminder-template-attachments";

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXT = /\.(pdf|jpe?g|png|webp|gif)$/i;

/** Caractères autorisés dans une clé Storage Supabase (segment de nom de fichier). */
const SAFE_STORAGE_KEY = /^[a-zA-Z0-9/._-]+$/;

export type ReminderTemplateAttachmentMeta = {
  storagePath: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

export function isAllowedReminderAttachment(file: Pick<File, "name" | "type">): boolean {
  const mime = file.type.trim().toLowerCase();
  if (mime && ALLOWED_MIME.has(mime)) return true;
  return ALLOWED_EXT.test(file.name.trim());
}

export function formatAttachmentBytes(bytes: number, locale: string): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024;
    return locale === "fr" ? `${kb.toFixed(kb < 10 ? 1 : 0)} Ko` : `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  }
  const mb = bytes / (1024 * 1024);
  return locale === "fr" ? `${mb.toFixed(mb < 10 ? 1 : 0)} Mo` : `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

export function attachmentLimitLabel(planId: PlanId, locale: string): string {
  const max = getReminderAttachmentMaxBytes(planId);
  const label = formatAttachmentBytes(max, locale);
  return locale === "fr"
    ? `PDF ou image, max. ${label} (${planLabelFr(planId)})`
    : `PDF or image, max. ${label} (${planLabelEn(planId)})`;
}

function planLabelFr(planId: PlanId): string {
  if (planId === "agency") return "Agence";
  if (planId === "pro") return "Pro";
  if (planId === "starter") return "Starter";
  return "plan actuel";
}

function planLabelEn(planId: PlanId): string {
  if (planId === "agency") return "Agency";
  if (planId === "pro") return "Pro";
  if (planId === "starter") return "Starter";
  return "current plan";
}

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Extension sûre pour la clé Storage (pas le nom affiché dans l’e-mail). */
export function safeAttachmentExtension(originalName: string): string {
  const lower = stripDiacritics(originalName.trim().toLowerCase());
  if (lower.endsWith(".pdf")) return ".pdf";
  if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) return ".jpg";
  if (lower.endsWith(".png")) return ".png";
  if (lower.endsWith(".webp")) return ".webp";
  if (lower.endsWith(".gif")) return ".gif";
  return "";
}

/**
 * Nom de fichier pour la clé Storage uniquement : ASCII, sans espaces ni apostrophes.
 * Le nom d’origine (ex. « Capture d’écran.png ») reste en base pour l’e-mail.
 */
export function sanitizeAttachmentStorageFileName(originalName: string): string {
  const ext = safeAttachmentExtension(originalName);
  const base = originalName.replace(/\.[^/.]+$/i, "");
  const slug = stripDiacritics(base)
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return `${slug || "fichier"}${ext || ".bin"}`;
}

export function buildAttachmentStoragePath(
  ownerUserId: string,
  workspaceId: string,
  daysAfterDue: number,
  originalFileName: string,
): string {
  const safeName = sanitizeAttachmentStorageFileName(originalFileName);
  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
  const path = `${ownerUserId}/${workspaceId}/${daysAfterDue}/${id}-${safeName}`;
  if (!SAFE_STORAGE_KEY.test(path)) {
    return `${ownerUserId}/${workspaceId}/${daysAfterDue}/${id}-fichier${safeAttachmentExtension(originalFileName) || ".bin"}`;
  }
  return path;
}

export function attachmentPathOwnedByUser(storagePath: string, userId: string): boolean {
  return storagePath.startsWith(`${userId}/`);
}

/** Nom affiché au destinataire (caractères d’origine conservés). */
export function displayAttachmentFileName(originalName: string): string {
  const trimmed = originalName.trim().replace(/[/\\]/g, "_");
  return (trimmed || "piece-jointe").slice(0, 200);
}
