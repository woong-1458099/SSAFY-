import Phaser from "phaser";
import { buildGameAssetPath } from "../../../common/assets/gameAssetPath";
import { MINIGAME_ASSET_CATALOG } from "../../../game/definitions/assets/minigameAssetCatalog";

export const LEGACY_DRINKING_NPCS = [
  { name: "민수", key: "minsu", comment: "\"오늘 3대 운동 했는데\n맥주는 괜찮아!\"" },
  { name: "명진", key: "thingham", comment: "\"이 분위기... 내가\n살려볼게요~\"" },
  { name: "종민", key: "jin", comment: "\"자자~ 다들 원샷\n가보자고!\"" },
  { name: "지우", key: "jyu", comment: "\"오늘 하루도\n수고했습니다 🙏\"" },
  { name: "효련", key: "hyo", comment: "\"코드보다 이게\n더 어렵네...\"" },
  { name: "연웅", key: "woong", comment: "\"빠르게 마시고\n빠르게 귀가!\"" },
];

export const LEGACY_DRINKING_NPC_ASSETS = [
  { key: "minsu", path: buildGameAssetPath("npc", "minsu.png") },
  { key: "thingham", path: buildGameAssetPath("npc", "myungjin.png") },
  { key: "jin", path: buildGameAssetPath("npc", "jongmin.png") },
  { key: "hyo", path: buildGameAssetPath("npc", "hyoryeon.png") },
  { key: "jyu", path: buildGameAssetPath("npc", "jiwoo.png") },
  { key: "woong", path: buildGameAssetPath("npc", "yeonwoong.png") },
];

export const LEGACY_DRINKING_ASSET_KEYS = {
  bgm: "bgm_halmac",
  background: "drinking-background",
  tableBack: "drinking-table-back",
  tableFront: "drinking-table-front",
  beerGlass: "drinking-beer-glass",
  grandma: "drinking-grandma",
  grandmaWalkAnimation: "halmi_walk",
} as const;

const LEGACY_DRINKING_IMAGE_ASSETS = [
  { key: LEGACY_DRINKING_ASSET_KEYS.background, path: MINIGAME_ASSET_CATALOG.beer.background },
  { key: LEGACY_DRINKING_ASSET_KEYS.tableBack, path: MINIGAME_ASSET_CATALOG.beer.tableBack },
  { key: LEGACY_DRINKING_ASSET_KEYS.tableFront, path: MINIGAME_ASSET_CATALOG.beer.tableFront },
] as const;

const LEGACY_DRINKING_SPRITESHEET_ASSETS = [
  {
    key: LEGACY_DRINKING_ASSET_KEYS.beerGlass,
    path: MINIGAME_ASSET_CATALOG.beer.beerGlass,
    frameConfig: { frameWidth: 94, frameHeight: 128 },
  },
  {
    key: LEGACY_DRINKING_ASSET_KEYS.grandma,
    path: MINIGAME_ASSET_CATALOG.beer.grandma,
    frameConfig: { frameWidth: 96, frameHeight: 136 },
  },
] as const;

export function preloadLegacyDrinkingAssets(scene: Phaser.Scene): void {
  scene.load.audio(LEGACY_DRINKING_ASSET_KEYS.bgm, MINIGAME_ASSET_CATALOG.beer.bgm);
  LEGACY_DRINKING_IMAGE_ASSETS.forEach((asset) => {
    scene.load.image(asset.key, asset.path);
  });
  LEGACY_DRINKING_SPRITESHEET_ASSETS.forEach((asset) => {
    scene.load.spritesheet(asset.key, asset.path, asset.frameConfig);
  });
  LEGACY_DRINKING_NPC_ASSETS.forEach((asset) => {
    scene.load.spritesheet(asset.key, asset.path, { frameWidth: 16, frameHeight: 32 });
  });
}

export const LEGACY_DRINKING_ROUNDS = 5;
export const LEGACY_DRINKING_PERFECT_RANGE = { min: 195, max: 245 } as const;
export const LEGACY_DRINKING_GOOD_RANGE = { min: 150, max: 300 } as const;

export function resolveLegacyDrinkingJudge(position: number) {
  if (position >= LEGACY_DRINKING_PERFECT_RANGE.min && position <= LEGACY_DRINKING_PERFECT_RANGE.max) {
    return { message: "🍺 PERFECT!", color: "#FFD700", score: 300, success: true, frame: 3, shake: false };
  }

  if (position >= LEGACY_DRINKING_GOOD_RANGE.min && position <= LEGACY_DRINKING_GOOD_RANGE.max) {
    return { message: "👍 GOOD!", color: "#44ff88", score: 150, success: true, frame: 2, shake: false };
  }

  return { message: "💦 FAIL!", color: "#ff4466", score: 0, success: false, frame: 1, shake: true };
}
