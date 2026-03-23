import type Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";
import {
  LEGACY_MINIGAME_MENU_SCENE_KEY,
  isDeprecatedMinigameSceneKey,
  isSupportedMinigameSceneKey,
  type LegacyMinigameFlowSceneKey,
  type LegacyMinigameSceneKey
} from "./minigameSceneKeys";
import { openLegacyMinigameMenu } from "./minigameLauncher";

export type MinigameLaunchKey = LegacyMinigameSceneKey | LegacyMinigameFlowSceneKey;

type ReturnSceneResolution = {
  requestedKey: string;
  resolvedKey: string;
  usedFallback: "requested" | "current" | "main";
};

export function openMinigameMenu(scene: Phaser.Scene, returnSceneKey: string) {
  const resolution = normalizeReturnSceneKey(scene, returnSceneKey);
  return openLegacyMinigameMenu(scene, resolution.resolvedKey);
}

function isRegisteredSceneKey(scene: Phaser.Scene, sceneKey: string): boolean {
  return sceneKey.length > 0 && sceneKey in scene.scene.manager.keys;
}

function normalizeReturnSceneKey(scene: Phaser.Scene, returnSceneKey: string): ReturnSceneResolution {
  const normalizedKey = returnSceneKey.trim();
  if (isRegisteredSceneKey(scene, normalizedKey)) {
    return {
      requestedKey: returnSceneKey,
      resolvedKey: normalizedKey,
      usedFallback: "requested",
    };
  }

  const currentSceneKey = scene.scene.key;
  if (isRegisteredSceneKey(scene, currentSceneKey)) {
    console.warn(`[minigame] invalid returnSceneKey requested: ${returnSceneKey}. Falling back to current scene ${currentSceneKey}.`);
    return {
      requestedKey: returnSceneKey,
      resolvedKey: currentSceneKey,
      usedFallback: "current",
    };
  }

  console.warn(`[minigame] invalid returnSceneKey requested: ${returnSceneKey}. Falling back to ${SCENE_KEYS.main}.`);
  return {
    requestedKey: returnSceneKey,
    resolvedKey: SCENE_KEYS.main,
    usedFallback: "main",
  };
}

export function launchMinigame(scene: Phaser.Scene, sceneKey: MinigameLaunchKey, returnSceneKey: string) {
  const resolution = normalizeReturnSceneKey(scene, returnSceneKey);

  if (scene.scene.isActive(sceneKey)) {
    return false;
  }

  if (scene.scene.isActive(LEGACY_MINIGAME_MENU_SCENE_KEY)) {
    scene.scene.stop(LEGACY_MINIGAME_MENU_SCENE_KEY);
  }

  const pauseSucceeded = scene.scene.isActive(resolution.resolvedKey);
  if (pauseSucceeded) {
    scene.scene.pause(resolution.resolvedKey);
  } else {
    console.warn(`[minigame] returnSceneKey ${resolution.resolvedKey} is not active; launch will proceed without pausing the return scene.`);
  }

  scene.scene.launch(sceneKey, {
    returnSceneKey: resolution.resolvedKey,
    requestedReturnSceneKey: resolution.requestedKey,
    resolvedReturnSceneKey: resolution.resolvedKey,
    returnScenePauseSucceeded: pauseSucceeded,
    returnSceneFallback: resolution.usedFallback,
  });
  return true;
}

export function launchMinigameByKey(scene: Phaser.Scene, sceneKey: string, returnSceneKey: string) {
  const resolution = normalizeReturnSceneKey(scene, returnSceneKey);

  if (!isSupportedMinigameSceneKey(sceneKey)) {
    const reason = isDeprecatedMinigameSceneKey(sceneKey) ? "deprecated" : "unknown";
    console.warn(`[minigame] ${reason} scene key requested: ${sceneKey}. Falling back to the minigame menu.`);
    return openLegacyMinigameMenu(scene, resolution.resolvedKey);
  }

  return launchMinigame(scene, sceneKey, resolution.resolvedKey);
}
