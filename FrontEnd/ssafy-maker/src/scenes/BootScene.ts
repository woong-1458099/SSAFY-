import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  preload(): void {
    this.load.image("logo", "assets/game/ui/206.png");
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#ffffff');

    const { width, height } = this.scale;

    const logo = this.add.image(width / 2, height / 2, "logo");
    logo.setScale(2.0);

    this.time.delayedCall(1000, () => {
      this.scene.start(SceneKey.Preload);
    });
  }
}