export class AudioManager {
  private bgmVolume = 0.7;
  private sfxVolume = 0.8;
  private ambienceVolume = 0.6;

  setBgmVolume(value: number): void {
    this.bgmVolume = Math.max(0, Math.min(1, value));
  }

  setSfxVolume(value: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, value));
  }

  setAmbienceVolume(value: number): void {
    this.ambienceVolume = Math.max(0, Math.min(1, value));
  }

  getVolumes(): { bgm: number; sfx: number; ambience: number } {
    return {
      bgm: this.bgmVolume,
      sfx: this.sfxVolume,
      ambience: this.ambienceVolume
    };
  }
}

