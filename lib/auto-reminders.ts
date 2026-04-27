const LS_KEY = "paypulse_auto_reminders_v1";

export function readAutoRemindersEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(LS_KEY);
  if (v === "0") return false;
  if (v === "1") return true;
  return true;
}

export function writeAutoRemindersEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, enabled ? "1" : "0");
}
