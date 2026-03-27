import Phaser from "phaser";
import { buildGameAssetPath } from "@shared/assets/gameAssetPath";

export const COMPLETION_FONT_FAMILY = "PFStardustBold";

export const COMPLETION_ASSET_KEYS = {
  bgm: "completion_bgm",
  typingSound: "typing_sound",
  finalMemory: "final_memory",
  animationSheet: "ending_ani",
  animationOnce: "ending_once"
} as const;

export function getCompletionMemoryKey(index: number): string {
  return `memory_${index}`;
}

export function preloadCompletionAssets(scene: Phaser.Scene): void {
  scene.load.audio(COMPLETION_ASSET_KEYS.bgm, buildGameAssetPath("audio", "BGM", "Completion.mp3"));
  scene.load.audio(COMPLETION_ASSET_KEYS.typingSound, buildGameAssetPath("audio", "SoundEffect", "type.mp3"));

  for (let i = 1; i <= 7; i += 1) {
    scene.load.image(getCompletionMemoryKey(i), buildGameAssetPath("backgrounds", "flashback", `${i}.png`));
  }

  scene.load.image(COMPLETION_ASSET_KEYS.finalMemory, buildGameAssetPath("backgrounds", "pass_SF.png"));
  scene.load.spritesheet(COMPLETION_ASSET_KEYS.animationSheet, buildGameAssetPath("backgrounds", "flashback", "completion_book.png"), {
    frameWidth: 372,
    frameHeight: 318
  });
}
