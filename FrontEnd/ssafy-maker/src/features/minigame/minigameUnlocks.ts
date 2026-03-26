import type Phaser from "phaser";
import type { LegacyMinigameSceneKey } from "./minigameSceneKeys";

const MINIGAME_UNLOCK_FLAG_PREFIX = "minigame:unlocked:";

type MinigameFlagHost = Phaser.Scene & {
  hasGameFlag?: (flag: string) => boolean;
  addGameFlags?: (flags: string[]) => void;
};

function resolveFlagHost(scene: Phaser.Scene, returnSceneKey?: string): MinigameFlagHost | null {
  const currentScene = scene as MinigameFlagHost;
  if (typeof currentScene.hasGameFlag === "function" || typeof currentScene.addGameFlags === "function") {
    return currentScene;
  }

  if (!returnSceneKey) {
    return null;
  }

  try {
    const returnScene = scene.scene.get(returnSceneKey) as MinigameFlagHost;
    return returnScene ?? null;
  } catch {
    return null;
  }
}

export function buildMinigameUnlockFlag(sceneKey: LegacyMinigameSceneKey): string {
  return `${MINIGAME_UNLOCK_FLAG_PREFIX}${sceneKey}`;
}

export function unlockMinigame(scene: Phaser.Scene, returnSceneKey: string, sceneKey: LegacyMinigameSceneKey): void {
  const host = resolveFlagHost(scene, returnSceneKey);
  if (!host || typeof host.addGameFlags !== "function") {
    return;
  }

  host.addGameFlags([buildMinigameUnlockFlag(sceneKey)]);
}

export function isMinigameUnlocked(scene: Phaser.Scene, returnSceneKey: string, sceneKey: LegacyMinigameSceneKey): boolean {
  const host = resolveFlagHost(scene, returnSceneKey);
  if (!host || typeof host.hasGameFlag !== "function") {
    return true;
  }

  return host.hasGameFlag(buildMinigameUnlockFlag(sceneKey));
}
