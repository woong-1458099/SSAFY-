// @ts-nocheck
import Phaser from 'phaser';
import {
  LEGACY_MINIGAME_MENU_SCENE_KEY,
  LEGACY_MINIGAME_PAUSE_SCENE_KEY
} from '../../../features/minigame/minigameSceneKeys';

const MINIGAME_PAUSE_INSTALL_KEY = '__minigamePauseInstallState';

function getPauseInstallState(scene) {
  return scene[MINIGAME_PAUSE_INSTALL_KEY];
}

function setPauseInstallState(scene, state) {
  if (state) {
    scene[MINIGAME_PAUSE_INSTALL_KEY] = state;
    return;
  }

  delete scene[MINIGAME_PAUSE_INSTALL_KEY];
}

/**
 * @param {Phaser.Scene} scene
 * @param {string | undefined} returnSceneKey
 */
export function installMinigamePause(scene, returnSceneKey) {
  const existingState = getPauseInstallState(scene);
  if (existingState?.installed) {
    return;
  }

  const resolvedReturnSceneKey = typeof returnSceneKey === 'string' && returnSceneKey.length > 0
    ? returnSceneKey
    : LEGACY_MINIGAME_MENU_SCENE_KEY;

  const escKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

  const handlePause = () => {
    if (!escKey || !Phaser.Input.Keyboard.JustDown(escKey)) {
      return;
    }

    if (scene.scene.isActive(LEGACY_MINIGAME_PAUSE_SCENE_KEY)) {
      return;
    }

    scene.scene.launch(LEGACY_MINIGAME_PAUSE_SCENE_KEY, {
      targetSceneKey: scene.scene.key,
      returnSceneKey: resolvedReturnSceneKey,
    });
    scene.scene.bringToTop(LEGACY_MINIGAME_PAUSE_SCENE_KEY);
    scene.scene.pause();
  };

  const cleanup = () => {
    const state = getPauseInstallState(scene);
    if (!state?.installed) {
      return;
    }

    state.installed = false;
    scene.events.off(Phaser.Scenes.Events.UPDATE, handlePause);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanup);
    scene.events.off(Phaser.Scenes.Events.DESTROY, cleanup);
    if (escKey) {
      scene.input.keyboard?.removeKey(escKey, false, false);
    }
    setPauseInstallState(scene, undefined);
  };

  setPauseInstallState(scene, { installed: true, cleanup });
  scene.events.on(Phaser.Scenes.Events.UPDATE, handlePause);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanup);
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanup);
}
