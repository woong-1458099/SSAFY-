import Phaser from "phaser";

export const PLACE_BACKGROUND_KEYS = {
  home: "place_bg_home"
} as const;

export function preloadPlaceBackgroundAssets(scene: Phaser.Scene): void {
  scene.load.image(PLACE_BACKGROUND_KEYS.home, "assets/game/backgrounds/myroom.png");
}

export function createPlaceBackgroundImage(
  scene: Phaser.Scene,
  textureKey: string | null
): Phaser.GameObjects.Image | null {
  if (!textureKey || !scene.textures.exists(textureKey)) {
    return null;
  }

  return scene.add
    .image(scene.scale.width / 2, scene.scale.height / 2, textureKey)
    .setDisplaySize(scene.scale.width, scene.scale.height)
    .setScrollFactor(0);
}
