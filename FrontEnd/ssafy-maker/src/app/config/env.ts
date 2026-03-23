export type AuthProvider = "backend-session" | "keycloak";

export type KeycloakEnv = {
  url: string;
  realm: string;
  clientId: string;
};

export type AppEnv = {
  apiBaseUrl: string;
  authProvider: AuthProvider;
  keycloak: KeycloakEnv | null;
};

function readTrimmedString(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function requireEnv(key: string, value: string | undefined): string {
  const normalized = readTrimmedString(value);
  if (!normalized) {
    throw new Error(`[env] Missing required environment variable: ${key}`);
  }

  return normalized;
}

function readAuthProvider(value: string | undefined): AuthProvider {
  const normalized = readTrimmedString(value) ?? "backend-session";
  if (normalized === "backend-session" || normalized === "keycloak") {
    return normalized;
  }

  throw new Error(`[env] Unsupported VITE_AUTH_PROVIDER: ${normalized}`);
}

function normalizeApiBaseUrl(value: string): string {
  const normalized = value.replace(/\/+$/u, "");

  try {
    const parsed = new URL(normalized);
    if (!parsed.protocol || !parsed.host) {
      throw new Error("invalid URL");
    }
  } catch {
    throw new Error(`[env] Invalid VITE_API_BASE_URL: ${value}`);
  }

  return normalized;
}

function readKeycloakEnv(rawEnv: ImportMetaEnv, authProvider: AuthProvider): KeycloakEnv | null {
  const url = readTrimmedString(rawEnv.VITE_KEYCLOAK_URL);
  const realm = readTrimmedString(rawEnv.VITE_KEYCLOAK_REALM);
  const clientId = readTrimmedString(rawEnv.VITE_KEYCLOAK_CLIENT_ID);
  const hasAnyKeycloakConfig = Boolean(url || realm || clientId);

  if (authProvider === "keycloak") {
    return {
      url: requireEnv("VITE_KEYCLOAK_URL", rawEnv.VITE_KEYCLOAK_URL),
      realm: requireEnv("VITE_KEYCLOAK_REALM", rawEnv.VITE_KEYCLOAK_REALM),
      clientId: requireEnv("VITE_KEYCLOAK_CLIENT_ID", rawEnv.VITE_KEYCLOAK_CLIENT_ID)
    };
  }

  if (hasAnyKeycloakConfig) {
    if (!url || !realm || !clientId) {
      throw new Error("[env] Incomplete Keycloak configuration. Set VITE_KEYCLOAK_URL, VITE_KEYCLOAK_REALM, and VITE_KEYCLOAK_CLIENT_ID together.");
    }

    return { url, realm, clientId };
  }

  return null;
}

export function loadAppEnv(rawEnv: ImportMetaEnv = import.meta.env): AppEnv {
  const authProvider = readAuthProvider(rawEnv.VITE_AUTH_PROVIDER);

  return {
    apiBaseUrl: normalizeApiBaseUrl(requireEnv("VITE_API_BASE_URL", rawEnv.VITE_API_BASE_URL)),
    authProvider,
    keycloak: readKeycloakEnv(rawEnv, authProvider)
  };
}

let cachedAppEnv: AppEnv | null = null;

export function getAppEnv(): AppEnv {
  cachedAppEnv ??= loadAppEnv();
  return cachedAppEnv;
}

export function assertAppEnv(): AppEnv {
  return getAppEnv();
}

export const APP_ENV = getAppEnv();
