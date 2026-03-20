import Phaser from "phaser";
import { SCENE_REGISTRY } from "../registry/sceneRegistry";

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: "app",
  backgroundColor: "#1f2430",
  scene: SCENE_REGISTRY,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};
