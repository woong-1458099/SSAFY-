import Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.boot);
  }

  create() {
    this.scene.start(SCENE_KEYS.preload);
  }
}
