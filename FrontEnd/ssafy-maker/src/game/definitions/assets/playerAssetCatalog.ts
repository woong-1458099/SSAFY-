import {
  getPlayerIdleTextureKey,
  getPlayerWalkTextureKey
} from "../../../common/assets/assetKeys";
import type { Facing } from "../../../common/enums/facing";
import type { PlayerAppearanceDefinition } from "../../../common/types/player";

// 플레이어도 NPC처럼 프레임 규칙을 카탈로그 계층에서 관리한다.
export const PLAYER_SPRITE_FRAME = {
  width: 16,
  height: 32
} as const;

export const PLAYER_FRAME_DURATION = 120;

export const PLAYER_DIRECTION_FRAMES: Record<Facing, { idle: number; walk: number[] }> = {
  right: { idle: 0, walk: [1, 2] },
  up: { idle: 3, walk: [4, 5, 6, 5] },
  left: { idle: 7, walk: [7, 8] },
  down: { idle: 9, walk: [10, 11, 12, 11] }
} as const;

export type PlayerLayerAssetDefinition = {
  idleTextureKey: string;
  walkTextureKey: string;
  idleImagePath: string;
  walkSpritesheetPath: string;
};

export type PlayerVisualAssetDefinition = {
  gender: PlayerAppearanceDefinition["gender"];
  hair: number;
  cloth: number;
  displayScale: number;
  frameWidth: number;
  frameHeight: number;
  directionFrames: Record<Facing, { idle: number; walk: number[] }>;
  base: PlayerLayerAssetDefinition;
  clothes: PlayerLayerAssetDefinition;
  hairLayer: PlayerLayerAssetDefinition;
};

function getAppearanceAssetId(appearance: PlayerAppearanceDefinition) {
  return `${appearance.gender}-${appearance.hair}-${appearance.cloth}`;
}

function createLayerAssetDefinition(
  appearance: PlayerAppearanceDefinition,
  layer: "base" | "clothes" | "hair",
  idleFileName: string,
  walkFileName: string
): PlayerLayerAssetDefinition {
  const appearanceAssetId = getAppearanceAssetId(appearance);

  return {
    idleTextureKey: getPlayerIdleTextureKey(appearanceAssetId, layer),
    walkTextureKey: getPlayerWalkTextureKey(appearanceAssetId, layer),
    idleImagePath: `/assets/game/character/${idleFileName}`,
    walkSpritesheetPath: `/assets/game/character/${walkFileName}`
  };
}

// 플레이어 외형 조합을 실제 렌더 메타로 바꾼다.
export function getPlayerAssetDefinition(
  appearance: PlayerAppearanceDefinition
): PlayerVisualAssetDefinition {
  const gender = appearance.gender;

  return {
    gender,
    hair: appearance.hair,
    cloth: appearance.cloth,
    displayScale: appearance.displayScale,
    frameWidth: PLAYER_SPRITE_FRAME.width,
    frameHeight: PLAYER_SPRITE_FRAME.height,
    directionFrames: PLAYER_DIRECTION_FRAMES,
    base: createLayerAssetDefinition(
      appearance,
      "base",
      `base_${gender}.png`,
      `base_${gender}_walk.png`
    ),
    clothes: createLayerAssetDefinition(
      appearance,
      "clothes",
      `${gender}_clothes_${appearance.cloth}.png`,
      `${gender}_clothes_${appearance.cloth}_walk.png`
    ),
    hairLayer: createLayerAssetDefinition(
      appearance,
      "hair",
      `${gender}_hair_${appearance.hair}.png`,
      `${gender}_hair_${appearance.hair}_walk.png`
    )
  };
}
