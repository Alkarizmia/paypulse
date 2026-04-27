const ACTING_OWNER_KEY = "paypulse_acting_owner_id";
const ACTING_WORKSPACE_KEY = "paypulse_acting_workspace_id";

/** Compte « propriétaire » affiché quand un collaborateur consulte le compte Agency. */
export function getActingOwnerUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(ACTING_OWNER_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function setActingOwnerUserId(ownerUserId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (ownerUserId) {
      window.sessionStorage.setItem(ACTING_OWNER_KEY, ownerUserId);
    } else {
      window.sessionStorage.removeItem(ACTING_OWNER_KEY);
      window.sessionStorage.removeItem(ACTING_WORKSPACE_KEY);
    }
  } catch {
    /* private mode */
  }
}

export function getActingWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.sessionStorage.getItem(ACTING_WORKSPACE_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function setActingWorkspaceId(workspaceId: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (workspaceId) {
      window.sessionStorage.setItem(ACTING_WORKSPACE_KEY, workspaceId);
    } else {
      window.sessionStorage.removeItem(ACTING_WORKSPACE_KEY);
    }
  } catch {
    /* ignore */
  }
}
