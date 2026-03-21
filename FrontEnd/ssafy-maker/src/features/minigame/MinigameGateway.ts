import type Phaser from "phaser";
import {
  LEGACY_MINIGAME_MENU_SCENE_KEY,
  type LegacyMinigameFlowSceneKey,
  type LegacyMinigameSceneKey
} from "./minigameSceneKeys";
import { openLegacyMinigameMenu } from "./minigameLauncher";

export type MinigameLaunchKey = LegacyMinigameSceneKey | LegacyMinigameFlowSceneKey;

export function openMinigameMenu(scene: Phaser.Scene, returnSceneKey: string) {
  return openLegacyMinigameMenu(scene, returnSceneKey);
}

export function launchMinigame(scene: Phaser.Scene, sceneKey: MinigameLaunchKey, returnSceneKey: string) {
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
