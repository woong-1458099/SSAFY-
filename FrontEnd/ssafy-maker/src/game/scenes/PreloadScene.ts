// 게임 시작 전에 공통 에셋과 TMX/TSX, NPC sprite 리소스를 미리 로드하는 씬이다.
import Phaser from "phaser";
import { ASSET_KEYS } from "../../common/assets/assetKeys";
import { SCENE_KEYS } from "../../common/enums/scene";
import { LEGACY_MINIGAME_MENU_SCENE_KEY } from "../../features/minigame/minigameSceneKeys";
import { preloadPlaceBackgroundAssets } from "../../features/place/placeBackgrounds";
import { AREA_TRANSITION_MARKER_SPRITE } from "../definitions/assets/areaTransitionAssetCatalog";
import { NPC_ASSET_LIST } from "../definitions/assets/npcAssetCatalog";
import { preloadNpcVisualAsset, registerNpcAnimations } from "../systems/npcAnimation";
import { preloadPlayerVisualAssets } from "../systems/playerVisual";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.preload);
  }

  preload() {
    // 실제 파일명 변경에 맞춰 tileset 이미지 경로를 수정한다.
    this.load.image(ASSET_KEYS.map.tilesetImage, "assets/game/map/FullAsset.png");
    // 캠퍼스 TMX가 참조하는 external TSX를 텍스트로 로드한다.
    this.load.text(ASSET_KEYS.map.tilesetTsx, "assets/game/map/FullTileSet.tsx");
    this.load.spritesheet(ASSET_KEYS.ui.buttons, "assets/game/ui/buttons.png", {
      frameWidth: AREA_TRANSITION_MARKER_SPRITE.frameWidth,
      frameHeight: AREA_TRANSITION_MARKER_SPRITE.frameHeight
    });

    // 각 영역 TMX를 텍스트로 로드한다.
    this.load.text(ASSET_KEYS.map.worldTmx, "assets/game/map/mainMap.tmx");
    this.load.text(ASSET_KEYS.map.downtownTmx, "assets/game/map/city.tmx");
    this.load.text(ASSET_KEYS.map.campusTmx, "assets/game/map/inSSAFY.tmx");

    // NPC 비주얼 에셋 로드는 전용 시스템으로 위임한다.
    for (const npcAsset of NPC_ASSET_LIST) {
      preloadNpcVisualAsset(this, npcAsset);
    }

    // 플레이어 기본 비주얼 에셋은 전용 시스템에서 로드한다.
    preloadPlayerVisualAssets(this);

    // 장소 팝업에서 사용하는 배경 에셋은 feature 계층 메타로 로드한다.
    preloadPlaceBackgroundAssets(this);
  }

  create() {
    // NPC 애니메이션 등록은 전용 시스템으로 위임한다.
    registerNpcAnimations(this, NPC_ASSET_LIST);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("minigame") === "true") {
      this.scene.start(LEGACY_MINIGAME_MENU_SCENE_KEY, { returnSceneKey: SCENE_KEYS.main });
      return;
    }

    this.scene.start(SCENE_KEYS.main);
  }
}
