import Phaser from "phaser";

export type AudioCategory = "bgm" | "sfx" | "ambience";

type VolumeState = {
  bgm: number;
  sfx: number;
  ambience: number;
};

type AudioSettingsStore = VolumeState & {
  bgmEnabled: boolean;
  sfxEnabled: boolean;
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
  private static sfxEnabled = AudioManager.loadSfxEnabled();
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

  setSfxEnabled(enabled: boolean): void {
    AudioManager.setSfxEnabled(enabled);
  }

  isSfxEnabled(): boolean {
    return AudioManager.sfxEnabled;
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

  stopManagedSounds(
    category: AudioCategory,
    options: {
      scene?: Phaser.Scene;
      exceptKey?: string;
    } = {}
  ): void {
    AudioManager.stopManagedSounds(category, options);
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

  private static setSfxEnabled(enabled: boolean): void {
    AudioManager.sfxEnabled = enabled;
    AudioManager.persistSettings();
    if (!enabled) {
      AudioManager.stopManagedSounds("sfx", {});
    }
    AudioManager.refreshManagedSounds();
  }

  private static getEffectiveVolumeFor(category: AudioCategory, baseVolume: number): number {
    if (category === "bgm" && !AudioManager.bgmEnabled) {
      return 0;
    }
    if (category === "sfx" && !AudioManager.sfxEnabled) {
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

  private static stopManagedSounds(
    category: AudioCategory,
    options: {
      scene?: Phaser.Scene;
      exceptKey?: string;
    }
  ): void {
    Array.from(AudioManager.managedSounds).forEach((entry) => {
      if (entry.category !== category) {
        return;
      }

      if (options.scene && entry.sound.manager !== options.scene.sound) {
        return;
      }

      const soundKey = (entry.sound as Phaser.Sound.BaseSound & { key?: string }).key;
      if (options.exceptKey && soundKey === options.exceptKey) {
        return;
      }

      if (entry.sound.isPlaying) {
        entry.sound.stop();
      }
    });
  }

  private static clamp(value: number): number {
    return Phaser.Math.Clamp(value, 0, 1);
  }

  private static isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  private static normalizeStoredSettings(value: unknown): AudioSettingsStore | null {
    if (!AudioManager.isRecord(value)) {
      return null;
    }

    return {
      bgm: AudioManager.clamp(typeof value.bgm === "number" ? value.bgm : AudioManager.defaultVolumes.bgm),
      sfx: AudioManager.clamp(typeof value.sfx === "number" ? value.sfx : AudioManager.defaultVolumes.sfx),
      ambience: AudioManager.clamp(typeof value.ambience === "number" ? value.ambience : AudioManager.defaultVolumes.ambience),
      bgmEnabled: typeof value.bgmEnabled === "boolean" ? value.bgmEnabled : true,
      sfxEnabled: typeof value.sfxEnabled === "boolean" ? value.sfxEnabled : true
    };
  }

  private static buildStoredSettings(): AudioSettingsStore {
    return {
      ...AudioManager.volumes,
      bgmEnabled: AudioManager.bgmEnabled,
      sfxEnabled: AudioManager.sfxEnabled
    };
  }

  private static readStoredSettings(): AudioSettingsStore | null {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(AudioManager.storageKey);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as unknown;
      return AudioManager.normalizeStoredSettings(parsed);
    } catch {
      return null;
    }
  }

  private static loadVolumes(): VolumeState {
    const parsed = AudioManager.readStoredSettings();
    return {
      bgm: AudioManager.clamp(parsed?.bgm ?? AudioManager.defaultVolumes.bgm),
      sfx: AudioManager.clamp(parsed?.sfx ?? AudioManager.defaultVolumes.sfx),
      ambience: AudioManager.clamp(parsed?.ambience ?? AudioManager.defaultVolumes.ambience)
    };
  }

  private static loadBgmEnabled(): boolean {
    const parsed = AudioManager.readStoredSettings();
    return parsed?.bgmEnabled ?? true;
  }

  private static loadSfxEnabled(): boolean {
    const parsed = AudioManager.readStoredSettings();
    return parsed?.sfxEnabled ?? true;
  }

  private static persistSettings(): void {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(
        AudioManager.storageKey,
        JSON.stringify(AudioManager.buildStoredSettings())
      );
    } catch (error) {
      console.warn("[AudioManager] failed to persist audio settings", error);
    }
  }
}
