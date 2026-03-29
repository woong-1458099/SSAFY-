import {
  API_PREFIX,
  type ApiResponse,
  type DeathRecordTokenResponse,
  type RecordDeathRequest,
  type UserProfile
} from "@features/auth/api";

export type { DeathRecordTokenResponse, RecordDeathRequest };

export class DeathDashboardUnavailableError extends Error {
  constructor(message = "Death dashboard endpoint unavailable") {
    super(message);
    this.name = "DeathDashboardUnavailableError";
  }
}

export interface DeathRecordEvent {
  id: string;
  userId: string;
  username: string | null;
  deathCountSnapshot: number;
  diedAt: string;
  areaId: string | null;
  sceneId: string | null;
  cause: string | null;
}

export interface DeathRankingEntry {
  userId: string;
  username: string | null;
  deathCount: number;
  lastDeathAt: string | null;
}

export interface DeathDashboardResponse {
  recentDeaths: DeathRecordEvent[];
  topDeathCounts: DeathRankingEntry[];
}

const ROUTE_NOT_FOUND_CODE = "ROUTE_NOT_FOUND";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    credentials: "include",
    ...init
  });
  const raw = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const normalizedRaw = raw.trimStart().toLowerCase();

  if (
    contentType.includes("text/html") ||
    normalizedRaw.startsWith("<!doctype html") ||
    normalizedRaw.startsWith("<html")
  ) {
    throw new DeathDashboardUnavailableError();
  }

  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(raw) as ApiResponse<T>;
  } catch {
    if (response.status === 404) {
      throw new DeathDashboardUnavailableError();
    }
    throw new Error(raw || "Death API request failed");
  }

  if (response.status === 404 || payload.code === ROUTE_NOT_FOUND_CODE) {
    throw new DeathDashboardUnavailableError();
  }

  if (!response.ok || payload.code !== "OK") {
    throw new Error(payload.message || "Death API request failed");
  }

  return payload.data;
}

export function issueDeathRecordToken(): Promise<DeathRecordTokenResponse> {
  console.log("[death-api] issueDeathRecordToken");
  return request<DeathRecordTokenResponse>("/users/me/deaths/token", {
    method: "POST"
  });
}

export function recordCurrentUserDeath(
  token: string,
  body: RecordDeathRequest = {}
): Promise<UserProfile> {
  console.log("[death-api] recordCurrentUserDeath");
  return request<UserProfile>("/users/me/deaths", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Death-Record-Token": token
    },
    body: JSON.stringify(body)
  });
}

export function fetchDeathDashboard(
  options: {
    recentLimit?: number;
    rankingLimit?: number;
  } = {}
): Promise<DeathDashboardResponse> {
  const params = new URLSearchParams();
  if (typeof options.recentLimit === "number") {
    params.set("recentLimit", String(options.recentLimit));
  }
  if (typeof options.rankingLimit === "number") {
    params.set("rankingLimit", String(options.rankingLimit));
  }

  const query = params.toString();
  return request<DeathDashboardResponse>(`/public/deaths/dashboard${query ? `?${query}` : ""}`, {
    method: "GET"
  });
}
