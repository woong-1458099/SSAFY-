import Phaser from "phaser";
import { SCENE_REGISTRY } from "../registry/sceneRegistry";

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: "app",
  backgroundColor: "#1f2430",
  pixelArt: true,
  antialias: false,
  scene: SCENE_REGISTRY,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  dom: {
    // Smile minigames use Phaser DOMElement for the camera surface.
    // This enables a single global container, so the scene cleanup path must destroy DOM nodes on shutdown.
    createContainer: true
  }
};
