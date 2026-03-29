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
  ownerScene?: Phaser.Scene;
};

export class AudioManager {
  private static readonly storageKey = "ssafy-maker-audio-settings";
  private static readonly legacyStorageKeys = {
    volumes: "ssafy-maker-audio-volumes",
    bgmEnabled: "ssafy-maker-bgm-enabled",
    sfxEnabled: "ssafy-maker-sfx-enabled"
  } as const;
  private static readonly defaultVolumes: VolumeState = {
    bgm: 0.7,
    sfx: 0.8,
    ambience: 0.6
  };
  private static readonly defaultSettings: AudioSettingsStore = {
    ...AudioManager.defaultVolumes,
    bgmEnabled: true,
    sfxEnabled: true
  };
  private static readonly initialSettings = AudioManager.loadStoredSettingsSnapshot();
  private static bgmEnabled = AudioManager.initialSettings.bgmEnabled;
  private static sfxEnabled = AudioManager.initialSettings.sfxEnabled;
  private static volumes: VolumeState = {
    bgm: AudioManager.initialSettings.bgm,
    sfx: AudioManager.initialSettings.sfx,
    ambience: AudioManager.initialSettings.ambience
  };
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
    if (!AudioManager.isCategoryEnabled(category)) {
      return false;
    }

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
    if (!AudioManager.isCategoryEnabled(category)) {
      return null;
    }

    if (!scene.cache.audio.exists(key)) {
      return null;
    }

    const baseVolume = typeof config.volume === "number" ? config.volume : 1;
    const sound = scene.sound.add(key, {
      ...config,
      volume: AudioManager.getEffectiveVolumeFor(category, baseVolume)
    });

    AudioManager.registerManagedSound(sound, category, baseVolume, scene);

    return sound;
  }

  registerManagedSound(sound: Phaser.Sound.BaseSound, category: AudioCategory, baseVolume = 1): void {
    AudioManager.registerManagedSound(sound, category, baseVolume);
  }

  registerSceneManagedSound(
    scene: Phaser.Scene,
    sound: Phaser.Sound.BaseSound,
    category: AudioCategory,
    baseVolume = 1
  ): void {
    AudioManager.registerManagedSound(sound, category, baseVolume, scene);
  }

  stopManagedSounds(
    category: AudioCategory,
    options: {
      scene?: Phaser.Scene;
      exceptKey?: string;
      destroy?: boolean;
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
    console.log(`[AudioManager] BGM Enabled set to: ${enabled}`);
    AudioManager.bgmEnabled = enabled;
    AudioManager.persistSettings();
    if (!enabled) {
      AudioManager.stopManagedSounds("bgm", {});
    }
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

  private static isCategoryEnabled(category: AudioCategory): boolean {
    if (category === "bgm") {
      return AudioManager.bgmEnabled;
    }

    if (category === "sfx") {
      return AudioManager.sfxEnabled;
    }

    return true;
  }

  private static registerManagedSound(
    sound: Phaser.Sound.BaseSound,
    category: AudioCategory,
    baseVolume: number,
    ownerScene?: Phaser.Scene
  ): void {
    const existingEntry = Array.from(AudioManager.managedSounds).find((entry) => entry.sound === sound);
    if (existingEntry) {
      existingEntry.category = category;
      existingEntry.baseVolume = baseVolume;
      existingEntry.ownerScene = ownerScene ?? existingEntry.ownerScene;
      return;
    }

    const managedSound: ManagedSound = { sound, category, baseVolume, ownerScene };
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
      destroy?: boolean;
    }
  ): void {
    Array.from(AudioManager.managedSounds).forEach((entry) => {
      if (entry.category !== category) {
        return;
      }

      if (options.scene && entry.ownerScene !== options.scene) {
        return;
      }

      const soundKey = (entry.sound as Phaser.Sound.BaseSound & { key?: string }).key;
      if (options.exceptKey && soundKey === options.exceptKey) {
        return;
      }

      if (entry.sound.isPlaying) {
        entry.sound.stop();
      }

      if (options.destroy) {
        entry.sound.destroy();
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
      bgm: AudioManager.clamp(typeof value.bgm === "number" ? value.bgm : AudioManager.defaultSettings.bgm),
      sfx: AudioManager.clamp(typeof value.sfx === "number" ? value.sfx : AudioManager.defaultSettings.sfx),
      ambience: AudioManager.clamp(typeof value.ambience === "number" ? value.ambience : AudioManager.defaultSettings.ambience),
      bgmEnabled: typeof value.bgmEnabled === "boolean" ? value.bgmEnabled : true,
      sfxEnabled: typeof value.sfxEnabled === "boolean" ? value.sfxEnabled : true
    };
  }

  private static parseStoredNumber(value: unknown): number | null {
    return typeof value === "number" && Number.isFinite(value) ? AudioManager.clamp(value) : null;
  }

  private static parseStoredBoolean(value: unknown): boolean | null {
    return typeof value === "boolean" ? value : null;
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
      const parsedCurrent = raw ? AudioManager.normalizeStoredSettings(JSON.parse(raw) as unknown) : null;
      if (parsedCurrent) {
        return parsedCurrent;
      }

      return AudioManager.readLegacyStoredSettings();
    } catch {
      return null;
    }
  }

  private static readLegacyStoredSettings(): AudioSettingsStore | null {
    if (typeof window === "undefined") {
      return null;
    }

    const defaults = AudioManager.defaultSettings;
    let hasLegacyValue = false;
    const next: AudioSettingsStore = { ...defaults };

    const legacyVolumesRaw = window.localStorage.getItem(AudioManager.legacyStorageKeys.volumes);
    if (legacyVolumesRaw) {
      try {
        const parsed = JSON.parse(legacyVolumesRaw) as unknown;
        if (AudioManager.isRecord(parsed)) {
          const bgm = AudioManager.parseStoredNumber(parsed.bgm);
          const sfx = AudioManager.parseStoredNumber(parsed.sfx);
          const ambience = AudioManager.parseStoredNumber(parsed.ambience);

          if (bgm !== null) {
            next.bgm = bgm;
            hasLegacyValue = true;
          }
          if (sfx !== null) {
            next.sfx = sfx;
            hasLegacyValue = true;
          }
          if (ambience !== null) {
            next.ambience = ambience;
            hasLegacyValue = true;
          }

          const nestedVolumes = AudioManager.isRecord(parsed.volumes) ? parsed.volumes : null;
          if (nestedVolumes) {
            const nestedBgm = AudioManager.parseStoredNumber(nestedVolumes.bgm);
            const nestedSfx = AudioManager.parseStoredNumber(nestedVolumes.sfx);
            const nestedAmbience = AudioManager.parseStoredNumber(nestedVolumes.ambience);

            if (nestedBgm !== null) {
              next.bgm = nestedBgm;
              hasLegacyValue = true;
            }
            if (nestedSfx !== null) {
              next.sfx = nestedSfx;
              hasLegacyValue = true;
            }
            if (nestedAmbience !== null) {
              next.ambience = nestedAmbience;
              hasLegacyValue = true;
            }
          }

          const parsedBgmEnabled = AudioManager.parseStoredBoolean(parsed.bgmEnabled);
          const parsedSfxEnabled = AudioManager.parseStoredBoolean(parsed.sfxEnabled);
          if (parsedBgmEnabled !== null) {
            next.bgmEnabled = parsedBgmEnabled;
            hasLegacyValue = true;
          }
          if (parsedSfxEnabled !== null) {
            next.sfxEnabled = parsedSfxEnabled;
            hasLegacyValue = true;
          }
        }
      } catch {
        // Ignore malformed legacy payloads and continue checking other legacy keys.
      }
    }

    const legacyBgmEnabled = AudioManager.parseStoredBoolean(
      AudioManager.readJsonStoredValue(AudioManager.legacyStorageKeys.bgmEnabled)
    );
    const legacySfxEnabled = AudioManager.parseStoredBoolean(
      AudioManager.readJsonStoredValue(AudioManager.legacyStorageKeys.sfxEnabled)
    );

    if (legacyBgmEnabled !== null) {
      next.bgmEnabled = legacyBgmEnabled;
      hasLegacyValue = true;
    }
    if (legacySfxEnabled !== null) {
      next.sfxEnabled = legacySfxEnabled;
      hasLegacyValue = true;
    }

    return hasLegacyValue ? next : null;
  }

  private static readJsonStoredValue(storageKey: string): unknown {
    if (typeof window === "undefined") {
      return null;
    }

    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }

  private static loadStoredSettingsSnapshot(): AudioSettingsStore {
    const parsed = AudioManager.readStoredSettings();
    const normalized = parsed ?? AudioManager.defaultSettings;

    if (typeof window !== "undefined") {
      try {
        const raw = window.localStorage.getItem(AudioManager.storageKey);
        const serializedNormalized = JSON.stringify(normalized);
        if (raw && raw !== serializedNormalized) {
          window.localStorage.setItem(AudioManager.storageKey, serializedNormalized);
        }
      } catch {
        // Ignore migration persistence failures and continue with in-memory defaults.
      }
    }

    return normalized;
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
