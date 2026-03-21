import Phaser from "phaser";

import {
  LEGACY_MINIGAME_FLOW_SCENE_KEYS,
  LEGACY_MINIGAME_MENU_SCENE_KEY,
} from "./minigameSceneKeys";

export function isLegacyMinigameFlowActive(scene: Phaser.Scene): boolean {
  return LEGACY_MINIGAME_FLOW_SCENE_KEYS.some((sceneKey) => scene.scene.isActive(sceneKey));
}

export function openLegacyMinigameMenu(
  scene: Phaser.Scene,
  returnSceneKey: string,
  onOpen?: () => void
): boolean {
  if (isLegacyMinigameFlowActive(scene)) {
    return false;
  }

  onOpen?.();
  scene.scene.launch(LEGACY_MINIGAME_MENU_SCENE_KEY, { returnSceneKey });
  scene.scene.pause(returnSceneKey);
  return true;
}

export function returnToScene(scene: Phaser.Scene, returnSceneKey: string): void {
  const isPaused = scene.scene.isPaused(returnSceneKey);
  scene.scene.stop();
  if (isPaused) {
    scene.scene.resume(returnSceneKey);
  } else {
    scene.scene.start(returnSceneKey);
  }
}
