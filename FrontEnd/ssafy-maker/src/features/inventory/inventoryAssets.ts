import Phaser from "phaser";
import { buildGameAssetPath } from "../../common/assets/gameAssetPath";
import type { InventoryItemTemplate } from "./InventoryService";

const INVENTORY_ITEM_ICON_ASSETS: Array<{ key: string; path: string }> = [
  { key: "shop-item-chocolate", path: buildGameAssetPath("ui", "conv_items", "chocolate.png") },
  { key: "shop-item-ramen", path: buildGameAssetPath("ui", "conv_items", "ramen.png") },
  { key: "shop-item-dosirak", path: buildGameAssetPath("ui", "conv_items", "dosirak.png") },
  { key: "shop-item-energy-drink", path: buildGameAssetPath("ui", "conv_items", "energy_drink.png") },
  { key: "shop-item-snack", path: buildGameAssetPath("ui", "conv_items", "snack.png") },
  { key: "shop-item-cigarette", path: buildGameAssetPath("ui", "conv_items", "cigarette.png") },
  { key: "shop-item-soju", path: buildGameAssetPath("ui", "conv_items", "soju.png") },
  { key: "shop-item-keyboard", path: buildGameAssetPath("ui", "conv_items", "keyboard.png") },
  { key: "shop-item-mouse", path: buildGameAssetPath("ui", "conv_items", "mouse.png") }
];

export function preloadInventoryUiAssets(scene: Phaser.Scene): void {
  INVENTORY_ITEM_ICON_ASSETS.forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });
}

export function applyInventoryItemIconImage(
  scene: Phaser.Scene,
  image: Phaser.GameObjects.Image,
  item: InventoryItemTemplate,
  maxWidth: number,
  maxHeight: number
): boolean {
  if (!scene.textures.exists(item.iconKey)) {
    image.setVisible(false);
    return false;
  }

  const texture = scene.textures.get(item.iconKey).getSourceImage() as { width?: number; height?: number } | undefined;
  const sourceWidth = texture?.width ?? 1;
  const sourceHeight = texture?.height ?? 1;
  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);

  image.setTexture(item.iconKey);
  image.setDisplaySize(sourceWidth * scale, sourceHeight * scale);
  image.setVisible(true);
  return true;
}
