export const GAME_ASSET_ROOT = "assets/game" as const;

export function buildGameAssetPath(...segments: string[]): string {
  return [GAME_ASSET_ROOT, ...segments].join("/");
}
