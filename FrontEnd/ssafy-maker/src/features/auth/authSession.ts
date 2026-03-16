import { API_BASE_URL } from "@features/auth/api";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string | null;
  expiresAt: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  idToken: string | null;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    username: string | null;
    emailVerified: boolean;
    phone: string | null;
    birthday: string | null;
    provider: string;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
}

type AuthAction = "login" | "signup";

const storageKeys = {
  accessToken: "auth.accessToken",
  refreshToken: "auth.refreshToken",
  idToken: "auth.idToken",
  expiresAt: "auth.expiresAt",
  user: "auth.user"
};

function redirectUri(): string {
  return `${window.location.origin}${window.location.pathname}`;
}

function storeSession(tokens: AuthTokens, user: AuthSession["user"]): AuthSession {
  localStorage.setItem(storageKeys.accessToken, tokens.accessToken);
  localStorage.setItem(storageKeys.refreshToken, tokens.refreshToken);
  if (tokens.idToken) {
    localStorage.setItem(storageKeys.idToken, tokens.idToken);
  } else {
    localStorage.removeItem(storageKeys.idToken);
  }
  localStorage.setItem(storageKeys.expiresAt, String(tokens.expiresAt));
  localStorage.setItem(storageKeys.user, JSON.stringify(user));

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    idToken: tokens.idToken,
    expiresAt: tokens.expiresAt,
    user
  };
}

export function readStoredSession(): AuthSession | null {
  const accessToken = localStorage.getItem(storageKeys.accessToken);
  const refreshToken = localStorage.getItem(storageKeys.refreshToken);
  const idToken = localStorage.getItem(storageKeys.idToken);
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
    return { accessToken, refreshToken, idToken, expiresAt, user };
  } catch {
    clearStoredSession();
    return null;
  }
}

export function clearStoredSession(): void {
  localStorage.removeItem(storageKeys.accessToken);
  localStorage.removeItem(storageKeys.refreshToken);
  localStorage.removeItem(storageKeys.idToken);
  localStorage.removeItem(storageKeys.expiresAt);
  localStorage.removeItem(storageKeys.user);
}

function buildLogoutUrl(idTokenHint?: string | null): string {
  const idToken = idTokenHint ?? "";
  return `${API_BASE_URL}/api/auth/logout#${encodeURIComponent(idToken)}`;
}

export async function beginLogout(): Promise<void> {
  const idTokenHint = localStorage.getItem(storageKeys.idToken);
  console.log("[auth-session] beginLogout", {
    endpoint: `${API_BASE_URL}/api/auth/logout`,
    idTokenHintPresent: Boolean(idTokenHint)
  });
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      idTokenHint
    })
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

  clearStoredSession();
  window.location.assign(payload.data.logoutUrl || buildLogoutUrl(idTokenHint));
}

export async function beginBackendAuth(action: AuthAction, loginHint?: string): Promise<void> {
  void loginHint;
  console.log("[auth-session] beginBackendAuth", {
    action,
    redirectTo: `${API_BASE_URL}/api/auth/${action === "signup" ? "signup" : "login"}`
  });
  window.location.assign(`${API_BASE_URL}/api/auth/${action === "signup" ? "signup" : "login"}`);
}

function cleanupCallbackUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("auth_ticket");
  window.history.replaceState({}, document.title, url.toString());
}

export async function completeAuthIfPresent(): Promise<AuthSession | null> {
  const url = new URL(window.location.href);
  const ticket = url.searchParams.get("auth_ticket");
  console.log("[auth-session] completeAuthIfPresent", {
    currentUrl: window.location.href,
    ticketPresent: Boolean(ticket)
  });

  if (!ticket) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/session?ticket=${encodeURIComponent(ticket)}`);
  const raw = await response.text();
  console.log("[auth-session] auth ticket exchange response", {
    endpoint: `${API_BASE_URL}/api/auth/session`,
    status: response.status,
    raw
  });
  const payload = JSON.parse(raw) as {
    code: string;
    message: string;
    data: {
      accessToken: string;
      refreshToken: string;
      idToken: string | null;
      expiresAt: number;
      user: AuthSession["user"];
    };
  };

  cleanupCallbackUrl();
  if (!response.ok || payload.code !== "OK") {
    throw new Error(payload.message || "Authentication failed");
  }

  return storeSession(
    {
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken,
      idToken: payload.data.idToken,
      expiresAt: payload.data.expiresAt
    },
    payload.data.user
  );
}
