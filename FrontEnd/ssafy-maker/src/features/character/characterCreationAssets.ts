import Phaser from "phaser";
import {
  CHARACTER_CREATION_FRAME_CONFIG
} from "./characterCreationConfig";
import { buildGameAssetPath } from "@shared/assets/gameAssetPath";
import { preloadPlayerAvatarTextureAssets } from "@features/avatar/playerAvatarAssets";

export const CHARACTER_CREATION_ASSET_KEYS = {
  background: "title_bg",
  uiBox: "ui_box",
  maleButton: "male_button",
  femaleButton: "female_button",
  bgm: "create_bgm",
  click: "click_sfx"
} as const;

export function preloadCharacterCreationAssets(scene: Phaser.Scene): void {
  scene.load.image(CHARACTER_CREATION_ASSET_KEYS.background, buildGameAssetPath("backgrounds", "title_background.png"));
  scene.load.image(CHARACTER_CREATION_ASSET_KEYS.uiBox, buildGameAssetPath("ui", "medium_ui_box.png"));
  scene.load.image(CHARACTER_CREATION_ASSET_KEYS.maleButton, buildGameAssetPath("ui", "male.png"));
  scene.load.image(CHARACTER_CREATION_ASSET_KEYS.femaleButton, buildGameAssetPath("ui", "female.png"));
  scene.load.audio(CHARACTER_CREATION_ASSET_KEYS.bgm, buildGameAssetPath("audio", "BGM", "bye.mp3"));
  scene.load.audio(CHARACTER_CREATION_ASSET_KEYS.click, buildGameAssetPath("audio", "SoundEffect", "click.wav"));

  preloadPlayerAvatarTextureAssets(scene, CHARACTER_CREATION_FRAME_CONFIG);
}
