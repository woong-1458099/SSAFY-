export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface UserProfile {
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
}

export const API_PREFIX = "/api";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  console.log("[auth-api] request", {
    url: `${API_PREFIX}${path}`,
    method: init.method ?? "GET"
  });
  const response = await fetch(`${API_PREFIX}${path}`, {
    credentials: "include",
    ...init
  });
  const raw = await response.text();
  console.log("[auth-api] response", {
    url: `${API_PREFIX}${path}`,
    status: response.status,
    ok: response.ok,
    raw
  });

  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(raw) as ApiResponse<T>;
  } catch {
    throw new Error(raw || "API request failed");
  }

  if (!response.ok || payload.code !== "OK") {
    throw new Error(payload.message || "API request failed");
  }

  return payload.data;
}

export interface BackendAuthSession {
  authenticated: boolean;
  expiresAt: number;
  user: UserProfile | null;
}

export function bootstrapCurrentUser(): Promise<UserProfile> {
  console.log("[auth-api] bootstrapCurrentUser");
  return request<UserProfile>("/users/me/bootstrap", {
    method: "POST"
  });
}

export function fetchCurrentUser(): Promise<UserProfile> {
  console.log("[auth-api] fetchCurrentUser");
  return request<UserProfile>("/users/me", {
    method: "GET"
  });
}

export function fetchBackendSession(): Promise<BackendAuthSession> {
  console.log("[auth-api] fetchBackendSession");
  return request<BackendAuthSession>("/auth/session", {
    method: "GET"
  });
}
