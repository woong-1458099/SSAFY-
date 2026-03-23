import { APP_ENV } from "@app/config/env";

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

export const API_BASE_URL = APP_ENV.apiBaseUrl;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  console.log("[auth-api] request", {
    url: `${API_BASE_URL}${path}`,
    method: init.method ?? "GET"
  });
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init
  });
  const raw = await response.text();
  console.log("[auth-api] response", {
    url: `${API_BASE_URL}${path}`,
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
  return request<UserProfile>("/api/users/me/bootstrap", {
    method: "POST"
  });
}

export function fetchCurrentUser(): Promise<UserProfile> {
  console.log("[auth-api] fetchCurrentUser");
  return request<UserProfile>("/api/users/me", {
    method: "GET"
  });
}

export function fetchBackendSession(): Promise<BackendAuthSession> {
  console.log("[auth-api] fetchBackendSession");
  return request<BackendAuthSession>("/api/auth/session", {
    method: "GET"
  });
}
