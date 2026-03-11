import Phaser from "phaser";
import { SceneKey } from "@shared/enums/sceneKey";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";
import { preloadUiAssets } from "@features/ui/assets/preload-ui-assets";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Preload);
  }

  preload(): void {
    preloadUiAssets(this);
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
