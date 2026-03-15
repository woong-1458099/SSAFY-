export interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
}

export interface UserProfile {
  id: string;
  email: string;
  phone: string | null;
  birthday: string | null;
  provider: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080").replace(/\/$/, "");

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init);
  const raw = await response.text();

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

export function bootstrapCurrentUser(accessToken: string): Promise<UserProfile> {
  return request<UserProfile>("/api/users/me/bootstrap", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}

export function fetchCurrentUser(accessToken: string): Promise<UserProfile> {
  return request<UserProfile>("/api/users/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
}
