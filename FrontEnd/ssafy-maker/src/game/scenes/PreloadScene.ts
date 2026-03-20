// 래퍼와 동일한 맵 에셋 경로를 사용해 TMX와 타일셋 이미지를 미리 로드하는 프리로드 씬
import Phaser from "phaser";
import { ASSET_KEYS } from "../../common/assets/assetKeys";
import { SCENE_KEYS } from "../../common/enums/scene";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.preload);
  }

  preload() {
    this.load.image(ASSET_KEYS.map.tileset, "assets/game/map/Full Asset.png");
    this.load.text(ASSET_KEYS.map.worldTmx, "assets/game/map/mainMap.tmx");
    this.load.text(ASSET_KEYS.map.downtownTmx, "assets/game/map/city.tmx");
    this.load.text(ASSET_KEYS.map.campusTmx, "assets/game/map/inSSAFY.tmx");
  }

  create() {
    this.scene.start(SCENE_KEYS.main);
  }
}
