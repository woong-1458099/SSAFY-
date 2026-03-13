import Phaser from "phaser";
import { SCENE_REGISTRY } from "@app/registry/scenes";
import { GAME_CONSTANTS } from "@core/constants/gameConstants";

const loaderBaseUrl =
  typeof window === "undefined"
    ? import.meta.env.BASE_URL
    : new URL(import.meta.env.BASE_URL, window.location.origin).toString();

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONSTANTS.WIDTH,
  height: GAME_CONSTANTS.HEIGHT,
  backgroundColor: GAME_CONSTANTS.BACKGROUND_COLOR,
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  render: {
    pixelArt: true,
    antialias: false,
    antialiasGL: false,
    roundPixels: true
  },
  dom: {
    createContainer: true
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  loader: {
    baseURL: loaderBaseUrl
  },
  scene: SCENE_REGISTRY,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    autoRound: true
  }
};
