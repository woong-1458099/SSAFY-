import Phaser from "phaser";

type DisplaySettingsStore = {
  brightness: number;
};

export class DisplaySettingsManager {
  private static readonly storageKey = "ssafy-maker-display-settings";
  private static readonly defaultBrightness = 1;
  private static brightness = DisplaySettingsManager.loadBrightness();

  getBrightness(): number {
    return DisplaySettingsManager.brightness;
  }

  setBrightness(value: number): void {
    DisplaySettingsManager.brightness = DisplaySettingsManager.clamp(value);
    DisplaySettingsManager.persist();
  }

  private static clamp(value: number): number {
    return Phaser.Math.Clamp(value, 0.55, 1);
  }

  private static loadBrightness(): number {
    if (typeof window === "undefined") {
      return DisplaySettingsManager.defaultBrightness;
    }

    try {
      const raw = window.localStorage.getItem(DisplaySettingsManager.storageKey);
      if (!raw) {
        return DisplaySettingsManager.defaultBrightness;
      }

      const parsed = JSON.parse(raw) as Partial<DisplaySettingsStore>;
      return DisplaySettingsManager.clamp(parsed.brightness ?? DisplaySettingsManager.defaultBrightness);
    } catch {
      return DisplaySettingsManager.defaultBrightness;
    }
  }

  private static persist(): void {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      DisplaySettingsManager.storageKey,
      JSON.stringify({
        brightness: DisplaySettingsManager.brightness
      } satisfies DisplaySettingsStore)
    );
  }
}
