import { APP_ENV } from "../../shared/config/env";

export const DEBUG_FLAGS = {
  overlayEnabled: APP_ENV.enableDebugOverlay,
  worldGridEnabled: APP_ENV.enableDebugWorldGrid
} as const;
