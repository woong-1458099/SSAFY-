// 플레이어 비주얼 시스템은 정의와 카탈로그를 소비해 실제 렌더만 담당한다.
import Phaser from "phaser";
import type { Facing } from "../../common/enums/facing";
import type { PlayerAppearanceDefinition } from "../../common/types/player";
import {
  getPlayerAssetDefinition,
  PLAYER_FRAME_DURATION,
  type PlayerVisualAssetDefinition
} from "../definitions/assets/playerAssetCatalog";
import {
  getDefaultPlayerAppearanceDefinition,
  PLAYER_APPEARANCE_LIMITS,
  PLAYER_CLOTH_LIMITS
} from "../definitions/player/playerAppearanceDefinitions";

export type PlayerVisual = {
  root: Phaser.GameObjects.Container;
  base: Phaser.GameObjects.Sprite;
  clothes: Phaser.GameObjects.Sprite;
  hair: Phaser.GameObjects.Sprite;
  asset: PlayerVisualAssetDefinition;
};

function resolveSafeFrame(texture: Phaser.Textures.Texture, preferredFrame: number) {
  return texture.has(String(preferredFrame)) ? preferredFrame : 0;
}

function getTextureManager(
  sprite: Phaser.GameObjects.Sprite
): Phaser.Textures.TextureManager | null {
  const scene = sprite.scene;
  if (!scene?.textures || !sprite.active) {
    return null;
  }

  return scene.textures;
}

export function preloadPlayerVisualAssets(scene: Phaser.Scene) {
  const defaultAppearance = getDefaultPlayerAppearanceDefinition();
  const genders = Object.keys(PLAYER_APPEARANCE_LIMITS) as Array<keyof typeof PLAYER_APPEARANCE_LIMITS>;

  for (const gender of genders) {
    for (let hair = PLAYER_APPEARANCE_LIMITS[gender].hairMin; hair <= PLAYER_APPEARANCE_LIMITS[gender].hairMax; hair += 1) {
      for (
        let cloth = PLAYER_CLOTH_LIMITS.clothMin;
        cloth <= PLAYER_CLOTH_LIMITS.clothMax;
        cloth += 1
      ) {
        const asset = getPlayerAssetDefinition({
          gender,
          hair,
          cloth,
          displayScale: defaultAppearance.displayScale
        });

        scene.load.spritesheet(asset.base.idleTextureKey, asset.base.idleImagePath, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight
        });
        scene.load.spritesheet(asset.base.walkTextureKey, asset.base.walkSpritesheetPath, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight
        });
        scene.load.spritesheet(asset.clothes.idleTextureKey, asset.clothes.idleImagePath, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight
        });
        scene.load.spritesheet(asset.clothes.walkTextureKey, asset.clothes.walkSpritesheetPath, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight
        });
        scene.load.spritesheet(asset.hairLayer.idleTextureKey, asset.hairLayer.idleImagePath, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight
        });
        scene.load.spritesheet(asset.hairLayer.walkTextureKey, asset.hairLayer.walkSpritesheetPath, {
          frameWidth: asset.frameWidth,
          frameHeight: asset.frameHeight
        });
      }
    }
  }
}

export function createPlayerVisual(
  scene: Phaser.Scene,
  x: number,
  y: number,
  appearance: PlayerAppearanceDefinition
) {
  const asset = getPlayerAssetDefinition(appearance);
  const base = scene.add.sprite(0, 0, asset.base.idleTextureKey, 0).setOrigin(0.5, 1);
  const clothes = scene.add.sprite(0, 0, asset.clothes.idleTextureKey, 0).setOrigin(0.5, 1);
  const hair = scene.add.sprite(0, 0, asset.hairLayer.idleTextureKey, 0).setOrigin(0.5, 1);

  base.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  clothes.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
  hair.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);

  const root = scene.add.container(x, y, [base, clothes, hair]);
  root.setScale(asset.displayScale);

  return { root, base, clothes, hair, asset };
}

export function updatePlayerVisualFrame(
  visual: PlayerVisual,
  facing: Facing,
  isMoving: boolean,
  timeNow: number
) {
  const baseTextures = getTextureManager(visual.base);
  const clothesTextures = getTextureManager(visual.clothes);
  const hairTextures = getTextureManager(visual.hair);
  if (!baseTextures || !clothesTextures || !hairTextures || !visual.root.active) {
    return;
  }

  const facingFrames = visual.asset.directionFrames[facing];
  const walkFrame = isMoving
    ? facingFrames.walk[Math.floor(timeNow / PLAYER_FRAME_DURATION) % facingFrames.walk.length]
    : 0;
  const frame = isMoving ? walkFrame : facingFrames.idle;

  const baseTextureKey = isMoving ? visual.asset.base.walkTextureKey : visual.asset.base.idleTextureKey;
  const clothesTextureKey = isMoving
    ? visual.asset.clothes.walkTextureKey
    : visual.asset.clothes.idleTextureKey;
  const hairTextureKey = isMoving
    ? visual.asset.hairLayer.walkTextureKey
    : visual.asset.hairLayer.idleTextureKey;
  if (
    !baseTextures.exists(baseTextureKey) ||
    !clothesTextures.exists(clothesTextureKey) ||
    !hairTextures.exists(hairTextureKey)
  ) {
    return;
  }

  const baseFrame = resolveSafeFrame(
    baseTextures.get(baseTextureKey),
    frame
  );
  const clothesFrame = resolveSafeFrame(
    clothesTextures.get(clothesTextureKey),
    frame
  );
  const hairFrame = resolveSafeFrame(
    hairTextures.get(hairTextureKey),
    frame
  );

  if (visual.base.texture.key !== baseTextureKey) {
    visual.base.setTexture(baseTextureKey, baseFrame);
  } else {
    visual.base.setFrame(baseFrame);
  }

  if (visual.clothes.texture.key !== clothesTextureKey) {
    visual.clothes.setTexture(clothesTextureKey, clothesFrame);
  } else {
    visual.clothes.setFrame(clothesFrame);
  }

  if (visual.hair.texture.key !== hairTextureKey) {
    visual.hair.setTexture(hairTextureKey, hairFrame);
  } else {
    visual.hair.setFrame(hairFrame);
  }
}
