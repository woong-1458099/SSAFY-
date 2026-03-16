import Phaser from "phaser";

export type PlayerAvatarData = {
  gender: "male" | "female";
  hair: number;
  cloth: number;
};

export type PlayerFacing = "left" | "right" | "up" | "down";

export type PlayerVisualParts = {
  root: Phaser.GameObjects.Container;
  base: Phaser.GameObjects.Sprite;
  clothes: Phaser.GameObjects.Sprite;
  hair: Phaser.GameObjects.Sprite;
};

export const PLAYER_SPRITE_CONFIG = {
  frameWidth: 16,
  frameHeight: 32,
} as const;

export const PLAYER_DISPLAY_SCALE = 2.4;
export const PLAYER_WALK_FRAME_DURATION = 120;
const PLAYER_DIRECTION_FRAMES = {
  right: { idle: 0, walk: [1, 2] },
  up: { idle: 3, walk: [4, 5, 6, 5] },
  left: { idle: 7, walk: [7, 8] },
  down: { idle: 9, walk: [10, 11, 12, 11] },
} as const;

export function preloadPlayerAvatarAssets(scene: Phaser.Scene): void {
  scene.load.spritesheet("base_male", "../../assets/game/character/base_male.png", PLAYER_SPRITE_CONFIG);
  scene.load.spritesheet("base_female", "../../assets/game/character/base_female.png", PLAYER_SPRITE_CONFIG);
  scene.load.spritesheet("base_male_walk", "../../assets/game/character/base_male_walk.png", PLAYER_SPRITE_CONFIG);
  scene.load.spritesheet("base_female_walk", "../../assets/game/character/base_female_walk.png", PLAYER_SPRITE_CONFIG);

  for (let i = 1; i <= 3; i += 1) {
    scene.load.spritesheet(`male_hair_${i}`, `../../assets/game/character/male_hair_${i}.png`, PLAYER_SPRITE_CONFIG);
    scene.load.spritesheet(`female_hair_${i}`, `../../assets/game/character/female_hair_${i}.png`, PLAYER_SPRITE_CONFIG);
    scene.load.spritesheet(`male_clothes_${i}`, `../../assets/game/character/male_clothes_${i}.png`, PLAYER_SPRITE_CONFIG);
    scene.load.spritesheet(`female_clothes_${i}`, `../../assets/game/character/female_clothes_${i}.png`, PLAYER_SPRITE_CONFIG);
    scene.load.spritesheet(`male_hair_${i}_walk`, `../../assets/game/character/male_hair_${i}_walk.png`, PLAYER_SPRITE_CONFIG);
    scene.load.spritesheet(`female_hair_${i}_walk`, `../../assets/game/character/female_hair_${i}_walk.png`, PLAYER_SPRITE_CONFIG);
    scene.load.spritesheet(`male_clothes_${i}_walk`, `../../assets/game/character/male_clothes_${i}_walk.png`, PLAYER_SPRITE_CONFIG);
    scene.load.spritesheet(`female_clothes_${i}_walk`, `../../assets/game/character/female_clothes_${i}_walk.png`, PLAYER_SPRITE_CONFIG);
  }
}

export function buildPlayerVisual(
  scene: Phaser.Scene,
  x: number,
  y: number,
  avatar: PlayerAvatarData
): PlayerVisualParts {
  const gender = avatar.gender;
  const base = scene.add.sprite(0, 0, `base_${gender}`, 0).setOrigin(0.5, 1);
  const clothes = scene.add.sprite(0, 0, `${gender}_clothes_${avatar.cloth}`, 0).setOrigin(0.5, 1);
  const hair = scene.add.sprite(0, 0, `${gender}_hair_${avatar.hair}`, 0).setOrigin(0.5, 1);

  base.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  clothes.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  hair.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

  base.name = "base";
  clothes.name = "clothes";
  hair.name = "hair";

  const root = scene.add.container(x, y + 10, [base, clothes, hair]);
  root.setDepth(32);
  root.setScale(PLAYER_DISPLAY_SCALE);

  return { root, base, clothes, hair };
}

export function syncPlayerAvatarVisuals(
  player: Phaser.Physics.Arcade.Sprite | undefined,
  visual: PlayerVisualParts | undefined
): void {
  if (!player || !visual) return;
  visual.root.setPosition(player.x, player.y + 10);
  visual.root.setVisible(player.visible);
}

export function updatePlayerAvatarAnimation(params: {
  visual: PlayerVisualParts | undefined;
  avatar: PlayerAvatarData;
  currentFacing: PlayerFacing;
  move: { x: number; y: number };
  timeNow: number;
}): PlayerFacing {
  const { visual, avatar, move, timeNow } = params;
  let nextFacing = params.currentFacing;
  if (!visual) return nextFacing;

  const isMoving = Math.abs(move.x) > 0.01 || Math.abs(move.y) > 0.01;
  if (Math.abs(move.x) > Math.abs(move.y) && Math.abs(move.x) > 0.01) {
    nextFacing = move.x < 0 ? "left" : "right";
  } else if (Math.abs(move.y) > 0.01) {
    nextFacing = move.y < 0 ? "up" : "down";
  }

  const walkBaseKey = `base_${avatar.gender}_walk`;
  const walkClothesKey = `${avatar.gender}_clothes_${avatar.cloth}_walk`;
  const walkHairKey = `${avatar.gender}_hair_${avatar.hair}_walk`;
  const idleBaseKey = `base_${avatar.gender}`;
  const idleClothesKey = `${avatar.gender}_clothes_${avatar.cloth}`;
  const idleHairKey = `${avatar.gender}_hair_${avatar.hair}`;
  const facingFrames = PLAYER_DIRECTION_FRAMES[nextFacing];
  const walkFrame =
    facingFrames.walk.length === 1
      ? facingFrames.walk[0]
      : facingFrames.walk[Math.floor(timeNow / PLAYER_WALK_FRAME_DURATION) % facingFrames.walk.length];
  const idleFrame = Math.floor(timeNow / PLAYER_WALK_FRAME_DURATION) % 4;
  const targetFrame = isMoving ? walkFrame : idleFrame;
  const baseTextureKey = isMoving ? walkBaseKey : idleBaseKey;
  const clothesTextureKey = isMoving ? walkClothesKey : idleClothesKey;
  const hairTextureKey = isMoving ? walkHairKey : idleHairKey;

  visual.root.setScale(PLAYER_DISPLAY_SCALE);

  if (visual.base.texture.key !== baseTextureKey) {
    visual.base.setTexture(baseTextureKey, targetFrame);
  } else {
    visual.base.setFrame(targetFrame);
  }
  if (visual.clothes.texture.key !== clothesTextureKey) {
    visual.clothes.setTexture(clothesTextureKey, targetFrame);
  } else {
    visual.clothes.setFrame(targetFrame);
  }
  if (visual.hair.texture.key !== hairTextureKey) {
    visual.hair.setTexture(hairTextureKey, targetFrame);
  } else {
    visual.hair.setFrame(targetFrame);
  }

  return nextFacing;
}
