import Phaser from "phaser";
import { UI_ASSET_KEYS, type UiAssetKey } from "@features/ui/assets/ui-asset-keys";

type UiAssetManifestItem = {
  key: UiAssetKey;
  path: string;
};

// Keep this list empty until final art files are exported to assets/game/ui.
// Fill it later without changing scene logic.
const UI_ASSET_MANIFEST: UiAssetManifestItem[] = [];

export function preloadUiAssets(scene: Phaser.Scene): void {
  UI_ASSET_MANIFEST.forEach((item) => {
    scene.load.image(item.key, item.path);
  });
}

// Example entries for later use:
// UI_ASSET_MANIFEST.push(
//   { key: UI_ASSET_KEYS.PANEL_MAIN, path: "assets/game/ui/panel_main.png" },
//   { key: UI_ASSET_KEYS.TAB_SETTINGS, path: "assets/game/ui/tab_settings.png" }
// );

// Export to avoid tree-shaking and keep discoverability while assets are pending.
export const UI_ASSET_STUB_KEYS = UI_ASSET_KEYS;
