// 게임 시작 전에 공통 에셋과 TMX/TSX, NPC sprite 리소스를 미리 로드하는 씬이다.
import Phaser from "phaser";
import { ASSET_KEYS, ASSET_PATHS } from "../../common/assets/assetKeys";
import { SCENE_KEYS } from "../../common/enums/scene";
import { getAuthBootstrapState } from "../../features/auth/AuthGateway";
import { preloadInventoryUiAssets } from "../../features/inventory/inventoryAssets";
import { LEGACY_MINIGAME_MENU_SCENE_KEY } from "../../features/minigame/minigameSceneKeys";
import { preloadPlaceBackgroundAssets } from "../../features/place/placeBackgrounds";
import { AREA_TRANSITION_MARKER_SPRITE } from "../definitions/assets/areaTransitionAssetCatalog";
import { NPC_ASSET_LIST } from "../definitions/assets/npcAssetCatalog";
import { PORTRAIT_ASSET_LIST, PORTRAIT_FRAME_CONFIG } from "../definitions/assets/portraitAssetCatalog";
import { preloadNpcVisualAsset, registerNpcAnimations } from "../systems/npcAnimation";
import { preloadPlayerVisualAssets } from "../systems/playerVisual";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.preload);
  }

  preload() {
    // 실제 파일명 변경에 맞춰 tileset 이미지 경로를 수정한다.
    this.load.image(ASSET_KEYS.map.tilesetImage, ASSET_PATHS.map.tilesetImage);
    // 캠퍼스 TMX가 참조하는 external TSX를 텍스트로 로드한다.
    this.load.text(ASSET_KEYS.map.tilesetTsx, ASSET_PATHS.map.tilesetTsx);
    this.load.spritesheet(ASSET_KEYS.ui.buttons, ASSET_PATHS.ui.buttons, {
      frameWidth: AREA_TRANSITION_MARKER_SPRITE.frameWidth,
      frameHeight: AREA_TRANSITION_MARKER_SPRITE.frameHeight
    });
    // NPC 머리 위 감정 말풍선 (320×32, 10프레임 각 32×32)
    this.load.spritesheet(ASSET_KEYS.ui.emotion, ASSET_PATHS.ui.emotion, {
      frameWidth: 32,
      frameHeight: 32
    });

    this.load.audio("male_voice", "assets/game/audio/SoundEffect/voice_male.wav");
    this.load.audio("female_voice", "assets/game/audio/SoundEffect/voice_female.wav");
    this.load.audio("type_sfx", "assets/game/audio/SoundEffect/type.mp3");

    // 각 영역 TMX를 텍스트로 로드한다.
    this.load.text(ASSET_KEYS.map.worldTmx, ASSET_PATHS.map.worldTmx);
    this.load.text(ASSET_KEYS.map.downtownTmx, ASSET_PATHS.map.downtownTmx);
    this.load.text(ASSET_KEYS.map.campusTmx, ASSET_PATHS.map.campusTmx);
    this.load.json(ASSET_KEYS.story.authoredDialogues, ASSET_PATHS.story.authoredDialogues);
    this.load.json(ASSET_KEYS.story.authoredSceneStates, ASSET_PATHS.story.authoredSceneStates);

    // NPC 비주얼 에셋 로드는 전용 시스템으로 위임한다.
    for (const npcAsset of NPC_ASSET_LIST) {
      preloadNpcVisualAsset(this, npcAsset);
    }

    for (const portraitAsset of PORTRAIT_ASSET_LIST) {
      this.load.spritesheet(portraitAsset.textureKey, portraitAsset.assetPath, {
        frameWidth: PORTRAIT_FRAME_CONFIG.frameWidth,
        frameHeight: PORTRAIT_FRAME_CONFIG.frameHeight
      });
    }

    // 플레이어 기본 비주얼 에셋은 전용 시스템에서 로드한다.
    preloadPlayerVisualAssets(this);

    // 장소 팝업에서 사용하는 배경 에셋은 feature 계층 메타로 로드한다.
    preloadPlaceBackgroundAssets(this);
    preloadInventoryUiAssets(this);
  }

  create() {
    // NPC 애니메이션 등록은 전용 시스템으로 위임한다.
    registerNpcAnimations(this, NPC_ASSET_LIST);

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("minigame") === "true") {
      this.scene.start(LEGACY_MINIGAME_MENU_SCENE_KEY, { returnSceneKey: SCENE_KEYS.main });
      return;
    }

    this.scene.start(getAuthBootstrapState().authenticated ? SCENE_KEYS.start : SCENE_KEYS.login);
  }
}
