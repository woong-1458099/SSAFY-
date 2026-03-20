import Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.preload);
  }

  create() {
    this.scene.start(SCENE_KEYS.main);
  }
}
