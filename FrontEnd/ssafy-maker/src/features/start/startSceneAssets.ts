import Phaser from "phaser";
import { buildGameAssetPath } from "@shared/assets/gameAssetPath";

export const START_SCENE_FONT_FAMILY = "\"PFStardustBold\", \"Malgun Gothic\", \"Apple SD Gothic Neo\", \"Noto Sans KR\", sans-serif";

export const START_SCENE_ASSET_KEYS = {
  background: "start-bg",
  logo: "start-logo",
  newButton: "start-btn-new",
  continueButton: "start-btn-old",
  bgm: "start-bgm",
  click: "start-click"
} as const;

const START_SCENE_IMAGE_ASSETS = [
  { key: START_SCENE_ASSET_KEYS.background, path: buildGameAssetPath("backgrounds", "title_background.png") },
  { key: START_SCENE_ASSET_KEYS.logo, path: buildGameAssetPath("ui", "logo.png") },
  { key: START_SCENE_ASSET_KEYS.newButton, path: buildGameAssetPath("ui", "new_game.png") },
  { key: START_SCENE_ASSET_KEYS.continueButton, path: buildGameAssetPath("ui", "old_game.png") }
] as const;

const START_SCENE_AUDIO_ASSETS = [
  { key: START_SCENE_ASSET_KEYS.bgm, path: buildGameAssetPath("audio", "BGM", "MainTheme.mp3") },
  { key: START_SCENE_ASSET_KEYS.click, path: buildGameAssetPath("audio", "SoundEffect", "click.wav") }
] as const;

export function preloadStartSceneAssets(scene: Phaser.Scene): void {
  START_SCENE_IMAGE_ASSETS.forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });

  START_SCENE_AUDIO_ASSETS.forEach((asset) => {
    scene.load.audio(asset.key, asset.path);
  });
}
