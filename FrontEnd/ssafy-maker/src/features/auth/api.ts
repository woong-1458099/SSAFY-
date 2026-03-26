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
  deathCount: number;
  lastDeathAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeathRecordTokenResponse {
  token: string;
  expiresAt: string;
}

export interface RecordDeathRequest {
  areaId?: string;
  sceneId?: string;
  cause?: string;
}

export type BackendApiStatus = "unknown" | "available" | "unavailable";

const RAW_API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const API_PATH_SEGMENT = "/api";

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, "");
}

function ensureApiSuffix(pathname: string): string {
  const normalizedPath = stripTrailingSlashes(pathname) || "";
  if (normalizedPath.toLowerCase().endsWith(API_PATH_SEGMENT)) {
    return normalizedPath || API_PATH_SEGMENT;
  }

  return `${normalizedPath}${API_PATH_SEGMENT}`;
}

function handleInvalidApiBaseUrl(rawValue: string): string {
  console.warn("[auth-api] invalid VITE_API_BASE_URL; falling back to /api", {
    rawValue
  });
  return API_PATH_SEGMENT;
}

function normalizeApiBaseUrl(rawValue?: string): string {
  if (!rawValue) {
    return API_PATH_SEGMENT;
  }

  try {
    if (/^https?:\/\//i.test(rawValue)) {
      const url = new URL(rawValue);
      if (url.search || url.hash) {
        console.warn("[auth-api] VITE_API_BASE_URL query/hash is ignored during normalization", {
          rawValue
        });
      }
      const normalizedPath = ensureApiSuffix(url.pathname);
      return `${url.origin}${normalizedPath}`;
    }

    const sanitizedValue = rawValue.split(/[?#]/, 1)[0] ?? API_PATH_SEGMENT;
    if (sanitizedValue !== rawValue) {
      console.warn("[auth-api] VITE_API_BASE_URL query/hash is ignored during normalization", {
        rawValue
      });
    }
    return ensureApiSuffix(sanitizedValue);
  } catch {
    return handleInvalidApiBaseUrl(rawValue);
  }
}

const NORMALIZED_API_BASE_URL = normalizeApiBaseUrl(RAW_API_BASE_URL);
console.info("[auth-api] API_PREFIX normalized", {
  rawValue: RAW_API_BASE_URL ?? null,
  apiPrefix: NORMALIZED_API_BASE_URL
});

export const API_PREFIX = NORMALIZED_API_BASE_URL;
let backendApiStatus: BackendApiStatus = "unknown";

export function getBackendApiStatus(): BackendApiStatus {
  return backendApiStatus;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  console.log("[auth-api] request", {
    url: `${API_PREFIX}${path}`,
    method: init.method ?? "GET"
  });
  let response: Response;
  try {
    response = await fetch(`${API_PREFIX}${path}`, {
      credentials: "include",
      ...init
    });
    backendApiStatus = "available";
  } catch (error) {
    backendApiStatus = "unavailable";
    throw error;
  }
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

export function issueDeathRecordToken(): Promise<DeathRecordTokenResponse> {
  console.log("[auth-api] issueDeathRecordToken");
  return request<DeathRecordTokenResponse>("/users/me/deaths/token", {
    method: "POST"
  });
}

export function recordCurrentUserDeath(
  token: string,
  body: RecordDeathRequest = {}
): Promise<UserProfile> {
  console.log("[auth-api] recordCurrentUserDeath");
  return request<UserProfile>("/users/me/deaths", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Death-Record-Token": token
    },
    body: JSON.stringify(body)
  });
}
