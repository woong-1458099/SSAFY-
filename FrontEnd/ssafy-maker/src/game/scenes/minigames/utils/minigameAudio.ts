import Phaser from "phaser";
import { AudioManager } from "../../../../core/managers/AudioManager";

type MinigameAudioScene = Phaser.Scene & {
  __minigameBgmUnlockCleanup?: () => void;
};

function canPlayManagedSound(sound: Phaser.Sound.BaseSound): boolean {
  const typedSound = sound as Phaser.Sound.BaseSound & {
    isDestroyed?: boolean;
    pendingRemove?: boolean;
    active?: boolean;
  };

  return Boolean(
    sound.manager &&
    typedSound.isDestroyed !== true &&
    typedSound.pendingRemove !== true &&
    typedSound.active !== false
  );
}

export function playMinigameBgm(
  scene: Phaser.Scene,
  audioManager: AudioManager,
  key: string,
  options: {
    volume?: number;
  } = {}
): Phaser.Sound.BaseSound | null {
  const typedScene = scene as MinigameAudioScene;
  const volume = options.volume ?? 0.5;

  typedScene.__minigameBgmUnlockCleanup?.();
  typedScene.__minigameBgmUnlockCleanup = undefined;
  audioManager.stopManagedSounds("bgm", { scene });

  const bgm = audioManager.add(scene, key, "bgm", {
    loop: true,
    volume
  });

  if (!bgm) {
    return null;
  }

  if (!scene.sound.locked && canPlayManagedSound(bgm)) {
    bgm.play();
    return bgm;
  }

  const handleUnlocked = () => {
    typedScene.__minigameBgmUnlockCleanup = undefined;
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanupUnlockedHandler);
    scene.events.off(Phaser.Scenes.Events.DESTROY, cleanupUnlockedHandler);
    if (canPlayManagedSound(bgm) && !bgm.isPlaying) {
      bgm.play();
    }
  };

  const cleanupUnlockedHandler = () => {
    scene.sound.off(Phaser.Sound.Events.UNLOCKED, handleUnlocked);
    scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cleanupUnlockedHandler);
    scene.events.off(Phaser.Scenes.Events.DESTROY, cleanupUnlockedHandler);
    if (typedScene.__minigameBgmUnlockCleanup === cleanupUnlockedHandler) {
      typedScene.__minigameBgmUnlockCleanup = undefined;
    }
  };

  typedScene.__minigameBgmUnlockCleanup = cleanupUnlockedHandler;
  scene.sound.once(Phaser.Sound.Events.UNLOCKED, handleUnlocked);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cleanupUnlockedHandler);
  scene.events.once(Phaser.Scenes.Events.DESTROY, cleanupUnlockedHandler);

  return bgm;
}

export function stopMinigameBgm(scene: Phaser.Scene, audioManager: AudioManager): void {
  const typedScene = scene as MinigameAudioScene;
  typedScene.__minigameBgmUnlockCleanup?.();
  typedScene.__minigameBgmUnlockCleanup = undefined;
  audioManager.stopManagedSounds("bgm", { scene, destroy: true });
}
