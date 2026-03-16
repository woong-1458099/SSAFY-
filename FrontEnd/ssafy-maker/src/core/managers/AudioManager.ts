import Phaser from "phaser";

export type AudioCategory = "bgm" | "sfx" | "ambience";

type VolumeState = {
  bgm: number;
  sfx: number;
  ambience: number;
};

type ManagedSound = {
  sound: Phaser.Sound.BaseSound;
  category: AudioCategory;
  baseVolume: number;
};

export class AudioManager {
  private static readonly storageKey = "ssafy-maker-audio-settings";
  private static readonly defaultVolumes: VolumeState = {
    bgm: 0.7,
    sfx: 0.8,
    ambience: 0.6
  };
  private static volumes: VolumeState = AudioManager.loadVolumes();
  private static managedSounds = new Set<ManagedSound>();

  setBgmVolume(value: number): void {
    AudioManager.setVolume("bgm", value);
  }

  setSfxVolume(value: number): void {
    AudioManager.setVolume("sfx", value);
  }

  setAmbienceVolume(value: number): void {
    AudioManager.setVolume("ambience", value);
  }

  getVolumes(): VolumeState {
    return { ...AudioManager.volumes };
  }

  getEffectiveVolume(category: AudioCategory, baseVolume = 1): number {
    return AudioManager.getEffectiveVolumeFor(category, baseVolume);
  }

  play(scene: Phaser.Scene, key: string, category: AudioCategory, config: Phaser.Types.Sound.SoundConfig = {}): boolean {
    if (!scene.cache.audio.exists(key)) {
      return false;
    }

    const baseVolume = typeof config.volume === "number" ? config.volume : 1;
    return scene.sound.play(key, {
      ...config,
      volume: AudioManager.getEffectiveVolumeFor(category, baseVolume)
    });
  }

  add(
    scene: Phaser.Scene,
    key: string,
    category: AudioCategory,
    config: Phaser.Types.Sound.SoundConfig = {}
  ): Phaser.Sound.BaseSound | null {
    if (!scene.cache.audio.exists(key)) {
      return null;
    }

    const baseVolume = typeof config.volume === "number" ? config.volume : 1;
    const sound = scene.sound.add(key, {
      ...config,
      volume: AudioManager.getEffectiveVolumeFor(category, baseVolume)
    });

    const managedSound: ManagedSound = { sound, category, baseVolume };
    AudioManager.managedSounds.add(managedSound);
    sound.once("destroy", () => {
      AudioManager.managedSounds.delete(managedSound);
    });

    return sound;
  }

  updateManagedSoundVolume(sound: Phaser.Sound.BaseSound, category: AudioCategory, baseVolume = 1): void {
    sound.setVolume(AudioManager.getEffectiveVolumeFor(category, baseVolume));
  }

  private static setVolume(category: AudioCategory, value: number): void {
    AudioManager.volumes[category] = AudioManager.clamp(value);
    AudioManager.persistVolumes();
    AudioManager.refreshManagedSounds();
  }

  private static getEffectiveVolumeFor(category: AudioCategory, baseVolume: number): number {
    return AudioManager.clamp(baseVolume) * AudioManager.volumes[category];
  }

  private static refreshManagedSounds(): void {
    Array.from(AudioManager.managedSounds).forEach((entry) => {
      if (!entry.sound || !entry.sound.manager || (entry.sound as { isDestroyed?: boolean }).isDestroyed) {
        AudioManager.managedSounds.delete(entry);
        return;
      }
      entry.sound.setVolume(AudioManager.getEffectiveVolumeFor(entry.category, entry.baseVolume));
    });
  }

  private static clamp(value: number): number {
    return Phaser.Math.Clamp(value, 0, 1);
  }

  private static loadVolumes(): VolumeState {
    if (typeof window === "undefined") {
      return { ...AudioManager.defaultVolumes };
    }

    try {
      const raw = window.localStorage.getItem(AudioManager.storageKey);
      if (!raw) {
        return { ...AudioManager.defaultVolumes };
      }

      const parsed = JSON.parse(raw) as Partial<VolumeState>;
      return {
        bgm: AudioManager.clamp(parsed.bgm ?? AudioManager.defaultVolumes.bgm),
        sfx: AudioManager.clamp(parsed.sfx ?? AudioManager.defaultVolumes.sfx),
        ambience: AudioManager.clamp(parsed.ambience ?? AudioManager.defaultVolumes.ambience)
      };
    } catch {
      return { ...AudioManager.defaultVolumes };
    }
  }

  private static persistVolumes(): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(AudioManager.storageKey, JSON.stringify(AudioManager.volumes));
  }
}
