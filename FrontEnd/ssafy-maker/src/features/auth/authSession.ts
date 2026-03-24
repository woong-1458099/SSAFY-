import type Phaser from "phaser";
import { API_PREFIX, fetchBackendSession, type BackendAuthSession, type UserProfile } from "@features/auth/api";

export interface AuthSession {
  authenticated: boolean;
  expiresAt: number;
  user: UserProfile;
}

type AuthAction = "login" | "signup";
const AUTH_REDIRECT_PENDING_KEY = "ssafy-maker.auth.redirect.pending";
const AUTH_SESSION_STORAGE_KEY = "ssafy-maker.auth.session";
const LOGOUT_ENDPOINT = "/api/auth/logout";

function buildLogoutUrl(): string {
  return LOGOUT_ENDPOINT;
}

function cleanupCallbackUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("auth");
  window.history.replaceState({}, document.title, url.toString());
}

function clearAuthClientState(): void {
  clearPendingAuthRedirect();
  clearStoredSession();
}

function readPendingRedirectState(): string | null {
  try {
    return window.sessionStorage.getItem(AUTH_REDIRECT_PENDING_KEY);
  } catch {
    return null;
  }
}

function writePendingRedirectState(value: string | null): void {
  try {
    if (value == null) {
      window.sessionStorage.removeItem(AUTH_REDIRECT_PENDING_KEY);
      return;
    }
    window.sessionStorage.setItem(AUTH_REDIRECT_PENDING_KEY, value);
  } catch {
    // Ignore storage failures so auth flow still works in restrictive browsers.
  }
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

function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<AuthSession>;
  return candidate.authenticated === true &&
    typeof candidate.expiresAt === "number" &&
    typeof candidate.user?.id === "string" &&
    typeof candidate.user?.email === "string";
}

function writeStoredSession(value: AuthSession | null): void {
  try {
    if (!value) {
      window.sessionStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return;
    }

    window.sessionStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage failures so auth flow still works in restrictive browsers.
  }
}

export function persistSession(session: AuthSession): AuthSession {
  writeStoredSession(session);
  return session;
}

export function readStoredSession(): AuthSession | null {
  try {
    const raw = window.sessionStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!isAuthSession(parsed) || parsed.expiresAt <= Date.now()) {
      clearStoredSession();
      return null;
    }

    return parsed;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function clearStoredSession(): void {
  writeStoredSession(null);
}

export function applySessionToRegistry(registry: Phaser.Data.DataManager, session: AuthSession): void {
  registry.set("authToken", "bff-session");
  registry.set("authUser", {
    id: session.user.id,
    email: session.user.email,
    nickname: session.user.email.split("@")[0]?.slice(0, 8) ?? "player"
  });
}

export function clearAuthRegistry(registry: Phaser.Data.DataManager): void {
  registry.remove("authToken");
  registry.remove("authUser");
}

export function hasPendingAuthRedirect(): boolean {
  return readPendingRedirectState() !== null;
}

export function clearPendingAuthRedirect(): void {
  writePendingRedirectState(null);
}

export async function beginLogout(): Promise<void> {
  console.log("[auth-session] beginLogout", {
    endpoint: LOGOUT_ENDPOINT
  });
  const response = await fetch(LOGOUT_ENDPOINT, {
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
  writePendingRedirectState(JSON.stringify({
    action,
    startedAt: Date.now()
  }));
  const authPath = `${API_PREFIX}/auth/${action === "signup" ? "signup" : "login"}`;
  console.log("[auth-session] beginBackendAuth", {
    action,
    redirectTo: authPath
  });
  window.location.assign(authPath);
}

export async function completeAuthIfPresent(): Promise<AuthSession | null> {
  const url = new URL(window.location.href);
  const authResult = url.searchParams.get("auth");
  console.log("[auth-session] completeAuthIfPresent", {
    currentUrl: window.location.href,
    authResult
  });

  if (authResult == null) {
    return null;
  }

  if (authResult !== "success") {
    cleanupCallbackUrl();
    clearAuthClientState();
    throw new Error(`Authentication callback failed: ${authResult}`);
  }

  const session = await fetchBackendSession();
  cleanupCallbackUrl();
  if (!session.authenticated || !session.user) {
    clearAuthClientState();
    throw new Error("Authentication failed");
  }

  clearPendingAuthRedirect();

  return persistSession({
    authenticated: true,
    expiresAt: session.expiresAt,
    user: session.user
  });
}

export async function fetchExistingSession(): Promise<AuthSession | null> {
  try {
    const session = toAuthSession(await fetchBackendSession());
    if (session) {
      clearPendingAuthRedirect();
      persistSession(session);
    } else {
      clearStoredSession();
    }
    return session;
  } catch {
    clearStoredSession();
    return null;
  }
}
