import { bootstrapCurrentUser } from "@features/auth/api";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    phone: string | null;
    birthday: string | null;
    provider: string;
    createdAt: string;
    updatedAt: string;
  };
}

type AuthAction = "login" | "signup";

const config = {
  baseUrl: (import.meta.env.VITE_KEYCLOAK_BASE_URL ?? "http://localhost:8081").replace(/\/$/, ""),
  realm: import.meta.env.VITE_KEYCLOAK_REALM ?? "master",
  clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "ssafy-maker-public"
};

const storageKeys = {
  verifier: "auth.pkce.verifier",
  state: "auth.pkce.state",
  action: "auth.pkce.action",
  accessToken: "auth.accessToken",
  refreshToken: "auth.refreshToken",
  expiresAt: "auth.expiresAt",
  user: "auth.user"
};

function redirectUri(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

function authorizationEndpoint(): string {
  return `${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/auth`;
}

function tokenEndpoint(): string {
  return `${config.baseUrl}/realms/${config.realm}/protocol/openid-connect/token`;
}

function randomString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes).slice(0, length);
}

function base64UrlEncode(input: Uint8Array): string {
  let binary = "";
  input.forEach((value) => {
    binary += String.fromCharCode(value);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64UrlEncode(new Uint8Array(digest));
}

function persistPendingAuth(state: string, verifier: string, action: AuthAction): void {
  sessionStorage.setItem(storageKeys.state, state);
  sessionStorage.setItem(storageKeys.verifier, verifier);
  sessionStorage.setItem(storageKeys.action, action);
}

function clearPendingAuth(): void {
  sessionStorage.removeItem(storageKeys.state);
  sessionStorage.removeItem(storageKeys.verifier);
  sessionStorage.removeItem(storageKeys.action);
}

function storeSession(tokens: AuthTokens, user: AuthSession["user"]): AuthSession {
  localStorage.setItem(storageKeys.accessToken, tokens.accessToken);
  localStorage.setItem(storageKeys.refreshToken, tokens.refreshToken);
  localStorage.setItem(storageKeys.expiresAt, String(tokens.expiresAt));
  localStorage.setItem(storageKeys.user, JSON.stringify(user));

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    user
  };
}

export function readStoredSession(): AuthSession | null {
  const accessToken = localStorage.getItem(storageKeys.accessToken);
  const refreshToken = localStorage.getItem(storageKeys.refreshToken);
  const expiresAt = Number(localStorage.getItem(storageKeys.expiresAt) ?? "0");
  const userRaw = localStorage.getItem(storageKeys.user);

  if (!accessToken || !refreshToken || !expiresAt || !userRaw) {
    return null;
  }

  if (Date.now() >= expiresAt) {
    clearStoredSession();
    return null;
  }

  try {
    const user = JSON.parse(userRaw) as AuthSession["user"];
    return { accessToken, refreshToken, expiresAt, user };
  } catch {
    clearStoredSession();
    return null;
  }
}

export function clearStoredSession(): void {
  localStorage.removeItem(storageKeys.accessToken);
  localStorage.removeItem(storageKeys.refreshToken);
  localStorage.removeItem(storageKeys.expiresAt);
  localStorage.removeItem(storageKeys.user);
}

export async function beginPkceAuth(action: AuthAction): Promise<void> {
  const state = randomString(48);
  const verifier = randomString(96);
  const challenge = await sha256(verifier);

  persistPendingAuth(state, verifier, action);

  const url = new URL(authorizationEndpoint());
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", redirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  if (action === "signup") {
    url.searchParams.set("prompt", "create");
  }

  window.location.assign(url.toString());
}

async function exchangeCode(code: string, verifier: string): Promise<AuthTokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: config.clientId,
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier
  });

  const response = await fetch(tokenEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const raw = await response.text();
  if (!response.ok) {
    throw new Error(raw || "Token exchange failed");
  }

  const payload = JSON.parse(raw) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + payload.expires_in * 1000
  };
}

function cleanupCallbackUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("session_state");
  url.searchParams.delete("iss");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  window.history.replaceState({}, document.title, url.toString());
}

export async function completePkceAuthIfPresent(): Promise<AuthSession | null> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");

  if (error) {
    clearPendingAuth();
    cleanupCallbackUrl();
    throw new Error(errorDescription ?? error);
  }

  if (!code) {
    return null;
  }

  const expectedState = sessionStorage.getItem(storageKeys.state);
  const verifier = sessionStorage.getItem(storageKeys.verifier);

  if (!state || !expectedState || state !== expectedState || !verifier) {
    clearPendingAuth();
    cleanupCallbackUrl();
    throw new Error("Invalid PKCE callback state");
  }

  const tokens = await exchangeCode(code, verifier);
  const user = await bootstrapCurrentUser(tokens.accessToken);

  clearPendingAuth();
  cleanupCallbackUrl();
  return storeSession(tokens, user);
}
