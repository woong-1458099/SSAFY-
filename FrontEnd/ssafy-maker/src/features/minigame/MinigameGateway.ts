import type Phaser from "phaser";
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

export function launchMinigame(scene: Phaser.Scene, sceneKey: string, returnSceneKey: string) {
  if (!isSupportedMinigameSceneKey(sceneKey)) {
    const reason = isDeprecatedMinigameSceneKey(sceneKey) ? "deprecated" : "unknown";
    console.warn(`[minigame] ${reason} scene key requested: ${sceneKey}. Falling back to the minigame menu.`);
    return openLegacyMinigameMenu(scene, returnSceneKey);
  }

  if (scene.scene.isActive(sceneKey)) {
    return false;
  }

  if (scene.scene.isActive(LEGACY_MINIGAME_MENU_SCENE_KEY)) {
    scene.scene.stop(LEGACY_MINIGAME_MENU_SCENE_KEY);
  }

  scene.scene.pause(returnSceneKey);
  scene.scene.launch(sceneKey, { returnSceneKey });
  return true;
}
