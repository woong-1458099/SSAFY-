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

export function openMinigameMenu(scene: Phaser.Scene, returnSceneKey: string) {
  return openLegacyMinigameMenu(scene, returnSceneKey);
}

function normalizeReturnSceneKey(scene: Phaser.Scene, returnSceneKey: string): string {
  const normalizedKey = returnSceneKey.trim();
  const sceneExists = normalizedKey.length > 0 && normalizedKey in scene.scene.manager.keys;

  if (sceneExists) {
    return normalizedKey;
  }

  console.warn(`[minigame] invalid returnSceneKey requested: ${returnSceneKey}. Falling back to ${SCENE_KEYS.main}.`);
  return SCENE_KEYS.main;
}

export function launchMinigame(scene: Phaser.Scene, sceneKey: MinigameLaunchKey, returnSceneKey: string) {
  const safeReturnSceneKey = normalizeReturnSceneKey(scene, returnSceneKey);

  if (scene.scene.isActive(sceneKey)) {
    return false;
  }

  if (scene.scene.isActive(LEGACY_MINIGAME_MENU_SCENE_KEY)) {
    scene.scene.stop(LEGACY_MINIGAME_MENU_SCENE_KEY);
  }

  scene.scene.pause(safeReturnSceneKey);
  scene.scene.launch(sceneKey, { returnSceneKey: safeReturnSceneKey });
  return true;
}

export function launchMinigameByKey(scene: Phaser.Scene, sceneKey: string, returnSceneKey: string) {
  const safeReturnSceneKey = normalizeReturnSceneKey(scene, returnSceneKey);

  if (!isSupportedMinigameSceneKey(sceneKey)) {
    const reason = isDeprecatedMinigameSceneKey(sceneKey) ? "deprecated" : "unknown";
    console.warn(`[minigame] ${reason} scene key requested: ${sceneKey}. Falling back to the minigame menu.`);
    return openLegacyMinigameMenu(scene, safeReturnSceneKey);
  }

  return launchMinigame(scene, sceneKey, safeReturnSceneKey);
}
