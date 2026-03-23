import type Phaser from "phaser";
import {
  applySessionToRegistry,
  clearAuthRegistry,
  clearPendingAuthRedirect,
  clearStoredSession,
  completeAuthIfPresent,
  fetchExistingSession,
  readStoredSession,
  type AuthSession
} from "./authSession";

export type AuthBootstrapSource = "callback" | "stored" | "session" | "none" | "error";

export type AuthBootstrapState = {
  authenticated: boolean;
  session: AuthSession | null;
  source: AuthBootstrapSource;
  error?: string;
};

const DEFAULT_AUTH_BOOTSTRAP_STATE: AuthBootstrapState = {
  authenticated: false,
  session: null,
  source: "none"
};

let authBootstrapPromise: Promise<AuthBootstrapState> | null = null;
let authBootstrapState: AuthBootstrapState = DEFAULT_AUTH_BOOTSTRAP_STATE;

function finalizeAuthBootstrap(state: AuthBootstrapState): AuthBootstrapState {
  authBootstrapState = state;
  return state;
}

function buildUnauthenticatedState(source: AuthBootstrapSource, error?: string): AuthBootstrapState {
  return finalizeAuthBootstrap({
    authenticated: false,
    session: null,
    source,
    ...(error ? { error } : {})
  });
}

export async function initializeAuthGateway(): Promise<AuthBootstrapState> {
  if (authBootstrapPromise) {
    return authBootstrapPromise;
  }

  authBootstrapPromise = (async () => {
    try {
      const callbackSession = await completeAuthIfPresent();
      if (callbackSession) {
        return finalizeAuthBootstrap({
          authenticated: true,
          session: callbackSession,
          source: "callback"
        });
      }

      const storedSession = readStoredSession();
      if (storedSession) {
        return finalizeAuthBootstrap({
          authenticated: true,
          session: storedSession,
          source: "stored"
        });
      }

      const existingSession = await fetchExistingSession();
      if (existingSession) {
        return finalizeAuthBootstrap({
          authenticated: true,
          session: existingSession,
          source: "session"
        });
      }

      clearPendingAuthRedirect();
      clearStoredSession();
      return buildUnauthenticatedState("none");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      clearPendingAuthRedirect();
      clearStoredSession();
      return buildUnauthenticatedState("error", message);
    }
  })();

  return authBootstrapPromise;
}

export function getAuthBootstrapState(): AuthBootstrapState {
  return authBootstrapState;
}

export function seedAuthRegistry(game: Phaser.Game, state: AuthBootstrapState = authBootstrapState): void {
  clearAuthRegistry(game.registry);

  if (state.session) {
    applySessionToRegistry(game.registry, state.session);
  }
}
