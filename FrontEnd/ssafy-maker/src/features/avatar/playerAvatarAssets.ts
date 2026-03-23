import Phaser from "phaser";
import { CHARACTER_CREATION_MAX_CLOTH, CHARACTER_CREATION_MAX_HAIR } from "@features/character/characterCreationConfig";
import { buildGameAssetPath } from "@shared/assets/gameAssetPath";

export const PLAYER_AVATAR_TEXTURE_KEYS = {
  base: {
    male: "base_male",
    female: "base_female",
  },
  baseWalk: {
    male: "base_male_walk",
    female: "base_female_walk",
  },
} as const;

export type PlayerAvatarGender = keyof typeof PLAYER_AVATAR_TEXTURE_KEYS.base;

export const PLAYER_AVATAR_SPRITE_CONFIG = {
  frameWidth: 16,
  frameHeight: 32,
} as const;

function buildVariantKey(kind: "hair" | "clothes", gender: PlayerAvatarGender, index: number, walk = false): string {
  return `${gender}_${kind}_${index}${walk ? "_walk" : ""}`;
}

export function getPlayerAvatarBaseKey(gender: PlayerAvatarGender, walk = false): string {
  return walk ? PLAYER_AVATAR_TEXTURE_KEYS.baseWalk[gender] : PLAYER_AVATAR_TEXTURE_KEYS.base[gender];
}

export function getPlayerAvatarHairKey(gender: PlayerAvatarGender, index: number, walk = false): string {
  return buildVariantKey("hair", gender, index, walk);
}

export function getPlayerAvatarClothesKey(gender: PlayerAvatarGender, index: number, walk = false): string {
  return buildVariantKey("clothes", gender, index, walk);
}

export function preloadPlayerAvatarTextureAssets(
  scene: Phaser.Scene,
  frameConfig: Phaser.Types.Loader.FileTypes.ImageFrameConfig = PLAYER_AVATAR_SPRITE_CONFIG
): void {
  scene.load.spritesheet(
    PLAYER_AVATAR_TEXTURE_KEYS.base.male,
    buildGameAssetPath("character", "base_male.png"),
    frameConfig
  );
  scene.load.spritesheet(
    PLAYER_AVATAR_TEXTURE_KEYS.base.female,
    buildGameAssetPath("character", "base_female.png"),
    frameConfig
  );
  scene.load.spritesheet(
    PLAYER_AVATAR_TEXTURE_KEYS.baseWalk.male,
    buildGameAssetPath("character", "base_male_walk.png"),
    frameConfig
  );
  scene.load.spritesheet(
    PLAYER_AVATAR_TEXTURE_KEYS.baseWalk.female,
    buildGameAssetPath("character", "base_female_walk.png"),
    frameConfig
  );

  for (let i = 1; i <= CHARACTER_CREATION_MAX_HAIR; i += 1) {
    scene.load.spritesheet(getPlayerAvatarHairKey("male", i), buildGameAssetPath("character", `male_hair_${i}.png`), frameConfig);
    scene.load.spritesheet(getPlayerAvatarHairKey("female", i), buildGameAssetPath("character", `female_hair_${i}.png`), frameConfig);
    scene.load.spritesheet(getPlayerAvatarHairKey("male", i, true), buildGameAssetPath("character", `male_hair_${i}_walk.png`), frameConfig);
    scene.load.spritesheet(getPlayerAvatarHairKey("female", i, true), buildGameAssetPath("character", `female_hair_${i}_walk.png`), frameConfig);
  }

  for (let i = 1; i <= CHARACTER_CREATION_MAX_CLOTH; i += 1) {
    scene.load.spritesheet(getPlayerAvatarClothesKey("male", i), buildGameAssetPath("character", `male_clothes_${i}.png`), frameConfig);
    scene.load.spritesheet(getPlayerAvatarClothesKey("female", i), buildGameAssetPath("character", `female_clothes_${i}.png`), frameConfig);
    scene.load.spritesheet(getPlayerAvatarClothesKey("male", i, true), buildGameAssetPath("character", `male_clothes_${i}_walk.png`), frameConfig);
    scene.load.spritesheet(getPlayerAvatarClothesKey("female", i, true), buildGameAssetPath("character", `female_clothes_${i}_walk.png`), frameConfig);
  }
}
