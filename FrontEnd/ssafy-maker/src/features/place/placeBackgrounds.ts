import Phaser from "phaser";
import { buildGameAssetPath } from "../../common/assets/gameAssetPath";
import type { PlaceId } from "../../common/enums/area";

export const PLACE_BACKGROUND_KEYS = {
  cafe: "place_bg_cafe",
  store: "place_bg_store",
  home: "place_bg_home",
  gym: "place_bg_gym",
  ramen: "place_bg_ramen",
  karaoke: "place_bg_karaoke",
  lotto: "place_bg_lotto",
  beer: "place_bg_beer"
} as const;

const PLACE_BACKGROUND_ASSETS: Array<{ key: string; path: string }> = [
  { key: PLACE_BACKGROUND_KEYS.cafe, path: buildGameAssetPath("backgrounds", "cafe.png") },
  { key: PLACE_BACKGROUND_KEYS.store, path: buildGameAssetPath("backgrounds", "conv.png") },
  { key: PLACE_BACKGROUND_KEYS.home, path: buildGameAssetPath("backgrounds", "myroom.png") },
  { key: PLACE_BACKGROUND_KEYS.gym, path: buildGameAssetPath("backgrounds", "gym.png") },
  { key: PLACE_BACKGROUND_KEYS.ramen, path: buildGameAssetPath("backgrounds", "ramenthings.png") },
  { key: PLACE_BACKGROUND_KEYS.karaoke, path: buildGameAssetPath("backgrounds", "singroom.png") },
  { key: PLACE_BACKGROUND_KEYS.lotto, path: buildGameAssetPath("backgrounds", "lotto.png") },
  { key: PLACE_BACKGROUND_KEYS.beer, path: buildGameAssetPath("backgrounds", "hoff.png") }
];

const PLACE_BACKGROUND_ASSET_BY_KEY = new Map(
  PLACE_BACKGROUND_ASSETS.map((asset) => [asset.key, asset.path] as const)
);

const PLACE_BACKGROUND_KEY_BY_PLACE_ID: Partial<Record<PlaceId, string>> = {
  cafe: PLACE_BACKGROUND_KEYS.cafe,
  store: PLACE_BACKGROUND_KEYS.store,
  home: PLACE_BACKGROUND_KEYS.home,
  gym: PLACE_BACKGROUND_KEYS.gym,
  ramen: PLACE_BACKGROUND_KEYS.ramen,
  karaoke: PLACE_BACKGROUND_KEYS.karaoke,
  lotto: PLACE_BACKGROUND_KEYS.lotto,
  beer: PLACE_BACKGROUND_KEYS.beer
};

export function preloadPlaceBackgroundAssets(scene: Phaser.Scene): void {
  PLACE_BACKGROUND_ASSETS.forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });
}

export function getPlaceBackgroundTextureKey(placeId: PlaceId): string | null {
  return PLACE_BACKGROUND_KEY_BY_PLACE_ID[placeId] ?? null;
}

export function ensurePlaceBackgroundTexture(
  scene: Phaser.Scene,
  placeId: PlaceId,
  onReady: (textureKey: string | null) => void
): void {
  const textureKey = getPlaceBackgroundTextureKey(placeId);
  if (!textureKey) {
    onReady(null);
    return;
  }

  if (scene.textures.exists(textureKey)) {
    onReady(textureKey);
    return;
  }

  const assetPath = PLACE_BACKGROUND_ASSET_BY_KEY.get(textureKey);
  if (!assetPath) {
    onReady(null);
    return;
  }

  if (scene.load.isLoading()) {
    scene.load.once(Phaser.Loader.Events.COMPLETE, () => ensurePlaceBackgroundTexture(scene, placeId, onReady));
    return;
  }

  scene.load.image(textureKey, assetPath);
  scene.load.once(Phaser.Loader.Events.COMPLETE, () => onReady(textureKey));
  scene.load.start();
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
