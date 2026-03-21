import Phaser from "phaser";
import { MINIGAME_ASSET_CATALOG } from "../../../game/definitions/assets/minigameAssetCatalog";

export const LEGACY_COOKING_ASSET_KEYS = {
  bgm: "bgm_ramen",
  background: "cooking_bg",
  ingredients: "cooking-ingredients",
  pot: "cooking-pot",
} as const;

export function preloadLegacyCookingAssets(scene: Phaser.Scene): void {
  scene.load.audio(LEGACY_COOKING_ASSET_KEYS.bgm, MINIGAME_ASSET_CATALOG.ramen.bgm);
  scene.load.image(LEGACY_COOKING_ASSET_KEYS.background, MINIGAME_ASSET_CATALOG.ramen.background);
  scene.load.spritesheet(
    LEGACY_COOKING_ASSET_KEYS.ingredients,
    MINIGAME_ASSET_CATALOG.ramen.ingredients,
    { frameWidth: 128, frameHeight: 128 }
  );
  scene.load.image(LEGACY_COOKING_ASSET_KEYS.pot, MINIGAME_ASSET_CATALOG.ramen.pot);
}

export const LEGACY_COOKING_INGREDIENTS = [
  { name: "면", frame: 0, score: 30 },
  { name: "계란", frame: 1, score: 50 },
  { name: "파", frame: 2, score: 40 },
  { name: "차슈", frame: 3, score: 70 },
  { name: "수프", frame: 4, score: 30 },
  { name: "탄것", frame: 5, score: -80, bad: true }
];

export const LEGACY_COOKING_DISHES = [
  { minScore: 1100, name: "🏆 황금 라면", desc: "전설의 라면이 완성되었습니다!", color: "#FFD700", reward: "요리 +10, GP +40" },
  { minScore: 900, name: "🍜 특제 라면", desc: "정말 맛있는 라면이네요!", color: "#ff8844", reward: "요리 +7, GP +25" },
  { minScore: 700, name: "🍥 맛있는 라면", desc: "훌륭한 라면입니다!", color: "#44ff88", reward: "요리 +5, GP +15" },
  { minScore: 400, name: "🥢 평범한 라면", desc: "그럭저럭 먹을만 해요", color: "#88ccff", reward: "요리 +3, GP +5" },
  { minScore: 0, name: "😅 퍼진 라면", desc: "면이 좀 퍼졌네요...", color: "#aaaaaa", reward: "요리 +1" },
  { minScore: -999, name: "💀 실패한 요리", desc: "이건 먹을 수 없어요...", color: "#ff4466", reward: "스트레스 +5" }
] as const;
