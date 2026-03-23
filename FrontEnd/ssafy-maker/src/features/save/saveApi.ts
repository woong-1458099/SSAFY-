import { API_BASE_URL, type ApiResponse } from "@features/auth/api";

export interface BackendSaveFile {
  id: string;
  userId: string;
  slotNumber: number;
  name: string;
  gameState: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaveFileMutationRequest {
  slotNumber: number;
  name: string;
  gameState: string;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init
  });
  const raw = await response.text();

  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(raw) as ApiResponse<T>;
  } catch {
    throw new Error(raw || "Save API request failed");
  }

  if (!response.ok || payload.code !== "OK") {
    throw new Error(payload.message || "Save API request failed");
  }

  return payload.data;
}

export function fetchUserSaveFiles(userId: string): Promise<BackendSaveFile[]> {
  return request<BackendSaveFile[]>(`/users/${userId}/save-files`, {
    method: "GET"
  });
}

export function createUserSaveFile(userId: string, body: SaveFileMutationRequest): Promise<BackendSaveFile> {
  return request<BackendSaveFile>(`/users/${userId}/save-files`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

export function updateUserSaveFile(saveFileId: string, body: SaveFileMutationRequest): Promise<BackendSaveFile> {
  return request<BackendSaveFile>(`/save-files/${saveFileId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

export function deleteUserSaveFile(saveFileId: string): Promise<void> {
  return request<void>(`/save-files/${saveFileId}`, {
    method: "DELETE"
  });
}
