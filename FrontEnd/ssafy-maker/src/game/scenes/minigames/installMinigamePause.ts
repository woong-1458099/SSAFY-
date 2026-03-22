// @ts-nocheck
import Phaser from 'phaser';

export function installMinigamePause(scene, returnSceneKey = 'MenuScene') {
  const escKey = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

  const handlePause = () => {
    if (!escKey || !Phaser.Input.Keyboard.JustDown(escKey)) {
      return;
    }

    if (scene.scene.isActive('MinigamePauseScene')) {
      return;
    }

    scene.scene.launch('MinigamePauseScene', {
      targetSceneKey: scene.scene.key,
      returnSceneKey,
    });
    scene.scene.bringToTop('MinigamePauseScene');
    scene.scene.pause();
  };

  scene.events.on(Phaser.Scenes.Events.UPDATE, handlePause);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.UPDATE, handlePause);
  });
}
