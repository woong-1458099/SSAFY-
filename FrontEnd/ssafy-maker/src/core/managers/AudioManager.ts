import Phaser from "phaser";

export type AudioCategory = "bgm" | "sfx" | "ambience";

type VolumeState = {
  bgm: number;
  sfx: number;
  ambience: number;
};

type AudioSettingsStore = VolumeState & {
  bgmEnabled: boolean;
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
  private static bgmEnabled = AudioManager.loadBgmEnabled();
  private static volumes: VolumeState = AudioManager.loadVolumes();
  private static managedSounds = new Set<ManagedSound>();

  setBgmVolume(value: number): void {
    AudioManager.setVolume("bgm", value);
  }

  setBgmEnabled(enabled: boolean): void {
    AudioManager.setBgmEnabled(enabled);
  }

  isBgmEnabled(): boolean {
    return AudioManager.bgmEnabled;
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

    AudioManager.registerManagedSound(sound, category, baseVolume);

    return sound;
  }

  registerManagedSound(sound: Phaser.Sound.BaseSound, category: AudioCategory, baseVolume = 1): void {
    AudioManager.registerManagedSound(sound, category, baseVolume);
  }

  updateManagedSoundVolume(sound: Phaser.Sound.BaseSound, category: AudioCategory, baseVolume = 1): void {
    (sound as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound).setVolume(AudioManager.getEffectiveVolumeFor(category, baseVolume));
  }

  private static setVolume(category: AudioCategory, value: number): void {
    AudioManager.volumes[category] = AudioManager.clamp(value);
    AudioManager.persistSettings();
    AudioManager.refreshManagedSounds();
  }

  private static setBgmEnabled(enabled: boolean): void {
    AudioManager.bgmEnabled = enabled;
    AudioManager.persistSettings();
    AudioManager.refreshManagedSounds();
  }

  private static getEffectiveVolumeFor(category: AudioCategory, baseVolume: number): number {
    if (category === "bgm" && !AudioManager.bgmEnabled) {
      return 0;
    }
    return AudioManager.clamp(baseVolume) * AudioManager.volumes[category];
  }

  private static registerManagedSound(sound: Phaser.Sound.BaseSound, category: AudioCategory, baseVolume: number): void {
    const existingEntry = Array.from(AudioManager.managedSounds).find((entry) => entry.sound === sound);
    if (existingEntry) {
      existingEntry.category = category;
      existingEntry.baseVolume = baseVolume;
      return;
    }

    const managedSound: ManagedSound = { sound, category, baseVolume };
    AudioManager.managedSounds.add(managedSound);
    sound.once("destroy", () => {
      AudioManager.managedSounds.delete(managedSound);
    });
  }

  private static refreshManagedSounds(): void {
    Array.from(AudioManager.managedSounds).forEach((entry) => {
      if (!entry.sound || !entry.sound.manager || (entry.sound as { isDestroyed?: boolean }).isDestroyed) {
        AudioManager.managedSounds.delete(entry);
        return;
      }
      (entry.sound as Phaser.Sound.WebAudioSound | Phaser.Sound.HTML5AudioSound).setVolume(AudioManager.getEffectiveVolumeFor(entry.category, entry.baseVolume));
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

      const parsed = JSON.parse(raw) as Partial<AudioSettingsStore>;
      return {
        bgm: AudioManager.clamp(parsed.bgm ?? AudioManager.defaultVolumes.bgm),
        sfx: AudioManager.clamp(parsed.sfx ?? AudioManager.defaultVolumes.sfx),
        ambience: AudioManager.clamp(parsed.ambience ?? AudioManager.defaultVolumes.ambience)
      };
    } catch {
      return { ...AudioManager.defaultVolumes };
    }
  }

  private static loadBgmEnabled(): boolean {
    if (typeof window === "undefined") {
      return true;
    }

    try {
      const raw = window.localStorage.getItem(AudioManager.storageKey);
      if (!raw) {
        return true;
      }

      const parsed = JSON.parse(raw) as Partial<AudioSettingsStore>;
      return parsed.bgmEnabled ?? true;
    } catch {
      return true;
    }
  }

  private static persistSettings(): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      AudioManager.storageKey,
      JSON.stringify({
        ...AudioManager.volumes,
        bgmEnabled: AudioManager.bgmEnabled
      } satisfies AudioSettingsStore)
    );
  }
}
