import type Phaser from "phaser";

type MainSceneAutoSaveCoordinatorOptions = {
  scene: Phaser.Scene;
  checkIntervalMs: number;
  minIntervalMs: number;
  shouldAutoSave: () => boolean;
  buildFingerprint: () => string;
  save: () => Promise<void>;
};

export class MainSceneAutoSaveCoordinator {
  private readonly scene: Phaser.Scene;
  private readonly checkIntervalMs: number;
  private readonly minIntervalMs: number;
  private readonly shouldAutoSave: () => boolean;
  private readonly buildFingerprint: () => string;
  private readonly save: () => Promise<void>;
  private timer?: Phaser.Time.TimerEvent;
  private saveInFlight = false;
  private lastSavedFingerprint: string | null = null;
  private lastSuccessfulSaveAt = 0;

  constructor(options: MainSceneAutoSaveCoordinatorOptions) {
    this.scene = options.scene;
    this.checkIntervalMs = options.checkIntervalMs;
    this.minIntervalMs = options.minIntervalMs;
    this.shouldAutoSave = options.shouldAutoSave;
    this.buildFingerprint = options.buildFingerprint;
    this.save = options.save;
  }

  reset(): void {
    this.destroy();
    this.lastSavedFingerprint = null;
    this.lastSuccessfulSaveAt = 0;
  }

  start(): void {
    this.destroy();
    this.timer = this.scene.time.addEvent({
      delay: this.checkIntervalMs,
      loop: true,
      callback: () => {
        void this.saveIfNeeded();
      }
    });
  }

  destroy(): void {
    this.timer?.remove(false);
    this.timer = undefined;
    this.saveInFlight = false;
  }

  markCurrentStateAsSaved(): void {
    this.lastSavedFingerprint = this.buildFingerprint();
    this.lastSuccessfulSaveAt = Date.now();
  }

  private async saveIfNeeded(): Promise<void> {
    if (this.saveInFlight || !this.shouldAutoSave()) {
      return;
    }

    const currentFingerprint = this.buildFingerprint();
    if (currentFingerprint === this.lastSavedFingerprint) {
      return;
    }

    if (Date.now() - this.lastSuccessfulSaveAt < this.minIntervalMs) {
      return;
    }

    this.saveInFlight = true;

    try {
      await this.save();
      this.lastSavedFingerprint = currentFingerprint;
      this.lastSuccessfulSaveAt = Date.now();
    } catch (error) {
      console.error("[MainScene] conditional auto save failed", error);
    } finally {
      this.saveInFlight = false;
    }
  }
}
