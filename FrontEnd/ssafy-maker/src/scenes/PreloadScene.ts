import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import { preloadUiAssets } from "@features/ui/assets/preload-ui-assets";
import { preloadMainSceneAudioAssets, preloadMainSceneBackgroundAssets } from "@features/main-scene/mainSceneMedia";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  preload(): void {
    preloadUiAssets(this);
    preloadMainSceneBackgroundAssets(this);
    preloadMainSceneAudioAssets(this);
    this.load.image("map_tiles_full_asset", "assets/game/map/Full Asset.png");
    this.load.text("map_tmx_world", "assets/game/map/mainMap.tmx");
    this.load.text("map_tmx_downtown", "assets/game/map/city.tmx");
    this.load.text("map_tmx_campus", "assets/game/map/inSSAFY.tmx");
    this.load.json("story_fixed_week1", "assets/game/data/story/fixedevent/fixed_week1.json");
    this.load.json("story_fixed_week2", "assets/game/data/story/fixedevent/fixed_week2.json");
    this.load.json("story_fixed_week3", "assets/game/data/story/fixedevent/fixed_week3.json");
    this.load.json("story_fixed_week4", "assets/game/data/story/fixedevent/fixed_week4.json");
  }

  create(): void {
    this.add
      .text(GAME_CONSTANTS.WIDTH / 2 - 120, GAME_CONSTANTS.HEIGHT / 2, "Loading...", {
        color: "#ffffff",
        fontSize: "28px"
      })
      .setDepth(10);

    this.time.delayedCall(150, () => {
      this.scene.start(SceneKey.Login);
    });
  }
}
