import type Phaser from "phaser";
import {
  applySessionToRegistry,
  beginLogout,
  clearAuthRegistry,
  clearStoredSession,
  fetchExistingSession,
  getActiveAuthUserId,
  readStoredSession
} from "../../../features/auth/authSession";
import { SceneKey } from "../../../shared/enums/sceneKey";

export async function ensureMainSceneAuthenticatedEntry(
  registry: Phaser.Data.DataManager,
  scenePlugin: Phaser.Scenes.ScenePlugin
): Promise<boolean> {
  const storedSession = readStoredSession();
  if (storedSession) {
    if (registry.get("authToken") !== "bff-session") {
      applySessionToRegistry(registry, storedSession);
    }
    return true;
  }

  const authUser = registry.get("authUser") as { id?: string } | undefined;
  if (registry.get("authToken") === "bff-session" && authUser?.id && getActiveAuthUserId() === authUser.id) {
    return true;
  }

  const existingSession = await fetchExistingSession();
  if (!existingSession) {
    clearAuthRegistry(registry);
    clearStoredSession();
    scenePlugin.start(SceneKey.Login);
    return false;
  }

  applySessionToRegistry(registry, existingSession);
  return true;
}

export async function logoutMainSceneSession(
  registry: Phaser.Data.DataManager,
  scenePlugin: Phaser.Scenes.ScenePlugin,
  fallback: () => void
): Promise<void> {
  clearAuthRegistry(registry);
  clearStoredSession();

  try {
    await beginLogout();
  } catch (error) {
    console.error("[MainScene] logout failed, falling back to local logout", error);
    fallback();
    scenePlugin.start(SceneKey.Login);
  }
}
