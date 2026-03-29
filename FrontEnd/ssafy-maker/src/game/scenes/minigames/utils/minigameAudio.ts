import Phaser from "phaser";
import { AudioManager } from "../../../../core/managers/AudioManager";

export function playMinigameBgm(
  scene: Phaser.Scene,
  audioManager: AudioManager,
  key: string,
  options: {
    volume?: number;
  } = {}
): Phaser.Sound.BaseSound | null {
  const volume = options.volume ?? 0.5;

  audioManager.stopManagedSounds("bgm", { scene });

  const bgm = audioManager.add(scene, key, "bgm", {
    loop: true,
    volume
  });

  if (!bgm) {
    return null;
  }

  if (!scene.sound.locked) {
    bgm.play();
    return bgm;
  }

  scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
    if (bgm.manager && !bgm.isPlaying) {
      bgm.play();
    }
  });

  return bgm;
}

export function stopMinigameBgm(scene: Phaser.Scene, audioManager: AudioManager): void {
  audioManager.stopManagedSounds("bgm", { scene, destroy: true });
}
