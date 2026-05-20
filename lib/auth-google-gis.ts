import type { SupabaseClient } from "@supabase/supabase-js";

const GSI_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

type CredentialResponse = { credential: string };

type PromptMomentNotification = {
  isDisplayMoment: () => boolean;
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
};

type GoogleIdConfig = {
  client_id: string;
  callback: (response: CredentialResponse) => void;
  nonce?: string;
  use_fedcm_for_prompt?: boolean;
  auto_select?: boolean;
  context?: "signin" | "signup" | "use";
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void;
          prompt: (listener?: (notification: PromptMomentNotification) => void) => void;
          cancel: () => void;
        };
      };
    };
  }
}

let gsiLoadPromise: Promise<void> | null = null;

export function getGoogleWebClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return id || null;
}

export async function generateGoogleAuthNonce(): Promise<{ nonce: string; hashedNonce: string }> {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const encoder = new TextEncoder();
  const encodedNonce = encoder.encode(nonce);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashedNonce = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return { nonce, hashedNonce };
}

export function loadGoogleGsiScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (gsiLoadPromise) {
    return gsiLoadPromise;
  }

  gsiLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SCRIPT_SRC}"]`);
    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("google_gsi_load_failed")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("google_gsi_load_failed"));
    document.head.appendChild(script);
  });

  return gsiLoadPromise;
}

export type GoogleGisSignInResult =
  | { ok: true; nextPath: string }
  | { ok: false; message: string; fallbackToOAuth?: boolean };

export async function signInWithGoogleGis(
  supabase: SupabaseClient,
  clientId: string,
  nextPath: string,
): Promise<GoogleGisSignInResult> {
  try {
    await loadGoogleGsiScript();
  } catch {
    return { ok: false, message: "google_gsi_load_failed", fallbackToOAuth: true };
  }

  if (!window.google?.accounts?.id) {
    return { ok: false, message: "google_gsi_unavailable", fallbackToOAuth: true };
  }

  const { nonce, hashedNonce } = await generateGoogleAuthNonce();

  return new Promise((resolve) => {
    let settled = false;

    const finish = (result: GoogleGisSignInResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    window.google!.accounts.id.initialize({
      client_id: clientId,
      context: "signin",
      nonce: hashedNonce,
      use_fedcm_for_prompt: true,
      callback: (response: CredentialResponse) => {
        void supabase.auth
          .signInWithIdToken({
            provider: "google",
            token: response.credential,
            nonce,
          })
          .then(({ error }) => {
            if (error) {
              finish({ ok: false, message: error.message });
              return;
            }
            const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
            finish({ ok: true, nextPath: next });
          });
      },
    });

    window.google!.accounts.id.prompt((notification) => {
      if (settled) return;
      if (!notification.isNotDisplayed() && !notification.isSkippedMoment()) {
        return;
      }

      const reason = notification.isNotDisplayed()
        ? notification.getNotDisplayedReason()
        : notification.getSkippedReason();

      if (reason === "suppressed_by_user" || reason === "user_cancel") {
        finish({ ok: false, message: "google_sign_in_cancelled" });
        return;
      }

      finish({ ok: false, message: reason || "google_prompt_unavailable", fallbackToOAuth: true });
    });
  });
}
