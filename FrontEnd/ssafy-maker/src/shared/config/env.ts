function parseBooleanEnv(value: string | undefined, fallback: boolean): boolean {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return fallback;
}

export const APP_ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  enableAuthBypassLogin: parseBooleanEnv(import.meta.env.VITE_ENABLE_AUTH_BYPASS_LOGIN, import.meta.env.DEV),
  enableDebugShortcuts: parseBooleanEnv(import.meta.env.VITE_ENABLE_DEBUG_SHORTCUTS, import.meta.env.DEV),
  enableDebugOverlay: parseBooleanEnv(import.meta.env.VITE_ENABLE_DEBUG_OVERLAY, import.meta.env.DEV),
  enableDebugWorldGrid: parseBooleanEnv(import.meta.env.VITE_ENABLE_DEBUG_WORLD_GRID, import.meta.env.DEV)
} as const;
