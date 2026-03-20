// 이후 월드 로딩에 사용할 TMX 텍스트 에셋을 미리 로드하는 프리로드 씬
import Phaser from "phaser";
import { SCENE_KEYS } from "../../common/enums/scene";
import { ASSET_KEYS } from "../../common/assets/assetKeys";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.preload);
  }

  preload() {
    this.load.text(ASSET_KEYS.map.worldTmx, "assets/maps/world.tmx");
    this.load.text(ASSET_KEYS.map.downtownTmx, "assets/maps/downtown.tmx");
    this.load.text(ASSET_KEYS.map.campusTmx, "assets/maps/campus.tmx");
  }

  create() {
    this.scene.start(SCENE_KEYS.main);
  }
}
