import { API_BASE_URL, fetchBackendSession, type BackendAuthSession, type UserProfile } from "@features/auth/api";

export interface AuthSession {
  authenticated: boolean;
  expiresAt: number;
  user: UserProfile;
}

type AuthAction = "login" | "signup";

function buildLogoutUrl(): string {
  return `${API_BASE_URL}/api/auth/logout`;
}

function cleanupCallbackUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("auth");
  window.history.replaceState({}, document.title, url.toString());
}

function toAuthSession(session: BackendAuthSession): AuthSession | null {
  if (!session.authenticated || !session.user) {
    return null;
  }

  return {
    authenticated: true,
    expiresAt: session.expiresAt,
    user: session.user
  };
}

export function readStoredSession(): AuthSession | null {
  return null;
}

export function clearStoredSession(): void {
}

export async function beginLogout(): Promise<void> {
  console.log("[auth-session] beginLogout", {
    endpoint: `${API_BASE_URL}/api/auth/logout`
  });
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify({})
  });

  const raw = await response.text();
  console.log("[auth-session] beginLogout response", {
    status: response.status,
    raw
  });
  const payload = JSON.parse(raw) as {
    code: string;
    message: string;
    data: {
      logoutUrl: string;
    };
  };

  if (!response.ok || payload.code !== "OK") {
    throw new Error(payload.message || "Failed to prepare logout");
  }

  window.location.assign(payload.data.logoutUrl || buildLogoutUrl());
}

export async function beginBackendAuth(action: AuthAction, loginHint?: string): Promise<void> {
  void loginHint;
  console.log("[auth-session] beginBackendAuth", {
    action,
    redirectTo: `${API_BASE_URL}/api/auth/${action === "signup" ? "signup" : "login"}`
  });
  window.location.assign(`${API_BASE_URL}/api/auth/${action === "signup" ? "signup" : "login"}`);
}

export async function completeAuthIfPresent(): Promise<AuthSession | null> {
  const url = new URL(window.location.href);
  const authResult = url.searchParams.get("auth");
  console.log("[auth-session] completeAuthIfPresent", {
    currentUrl: window.location.href,
    authResult
  });

  if (authResult !== "success") {
    return null;
  }

  const session = await fetchBackendSession();
  cleanupCallbackUrl();
  if (!session.authenticated || !session.user) {
    throw new Error("Authentication failed");
  }

  return {
    authenticated: true,
    expiresAt: session.expiresAt,
    user: session.user
  };
}

export async function fetchExistingSession(): Promise<AuthSession | null> {
  try {
    return toAuthSession(await fetchBackendSession());
  } catch {
    return null;
  }
}
