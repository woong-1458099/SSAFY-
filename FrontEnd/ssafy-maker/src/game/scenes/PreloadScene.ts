// 게임 시작 전에 공통 에셋과 TMX/TSX 텍스트를 미리 로드하는 씬이다.
import Phaser from "phaser";
import { ASSET_KEYS } from "../../common/assets/assetKeys";
import { SCENE_KEYS } from "../../common/enums/scene";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.preload);
  }

  preload() {
    // 실제 파일명 변경에 맞춰 tileset 이미지 경로를 수정한다.
    this.load.image(ASSET_KEYS.map.tilesetImage, "assets/game/map/FullAsset.png");
    // 캠퍼스 TMX가 참조하는 external TSX를 텍스트로 로드한다.
    this.load.text(ASSET_KEYS.map.tilesetTsx, "assets/game/map/FullTileSet.tsx");

    // 각 영역 TMX를 텍스트로 로드한다.
    this.load.text(ASSET_KEYS.map.worldTmx, "assets/game/map/mainMap.tmx");
    this.load.text(ASSET_KEYS.map.downtownTmx, "assets/game/map/city.tmx");
    this.load.text(ASSET_KEYS.map.campusTmx, "assets/game/map/inSSAFY.tmx");
  }

  create() {
    this.scene.start(SCENE_KEYS.main);
  }
}
