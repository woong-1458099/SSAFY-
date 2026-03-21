// 배경, NPC, 맵 등에서 사용하는 에셋 키 문자열을 한곳에서 관리한다.
const NPC_IDLE_TEXTURE_PREFIX = "npc-idle";
const NPC_WALK_TEXTURE_PREFIX = "npc-walk";
const NPC_IDLE_ANIMATION_PREFIX = "npc-idle-anim";
const NPC_WALK_ANIMATION_PREFIX = "npc-walk-anim";
const PLAYER_IDLE_TEXTURE_PREFIX = "player-idle";
const PLAYER_WALK_TEXTURE_PREFIX = "player-walk";

export const ASSET_KEYS = {
  background: {
    world: "bg-world",
    downtown: "bg-downtown",
    campus: "bg-campus"
  },
  ui: {
    buttons: "ui-buttons"
  },
  map: {
    tilesetImage: "map_tiles_full_asset",
    tilesetTsx: "map_tileset_full_tsx",
    worldTmx: "map_tmx_world",
    downtownTmx: "map_tmx_downtown",
    campusTmx: "map_tmx_campus"
  }
} as const;

// NPC idle 텍스처 키를 규칙 기반으로 생성한다.
export function getNpcIdleTextureKey(npcVisualId: string) {
  return `${NPC_IDLE_TEXTURE_PREFIX}-${npcVisualId}`;
}

// NPC walking 스프라이트시트 키를 규칙 기반으로 생성한다.
export function getNpcWalkTextureKey(npcVisualId: string) {
  return `${NPC_WALK_TEXTURE_PREFIX}-${npcVisualId}`;
}

// NPC walking 애니메이션 키를 규칙 기반으로 생성한다.
export function getNpcWalkAnimationKey(npcVisualId: string) {
  return `${NPC_WALK_ANIMATION_PREFIX}-${npcVisualId}`;
}

// NPC idle 애니메이션 키를 규칙 기반으로 생성한다.
export function getNpcIdleAnimationKey(npcVisualId: string) {
  return `${NPC_IDLE_ANIMATION_PREFIX}-${npcVisualId}`;
}

// 플레이어 idle 텍스처 키를 규칙 기반으로 생성한다.
export function getPlayerIdleTextureKey(playerAppearanceId: string, layer: string) {
  return `${PLAYER_IDLE_TEXTURE_PREFIX}-${playerAppearanceId}-${layer}`;
}

// 플레이어 walking 텍스처 키를 규칙 기반으로 생성한다.
export function getPlayerWalkTextureKey(playerAppearanceId: string, layer: string) {
  return `${PLAYER_WALK_TEXTURE_PREFIX}-${playerAppearanceId}-${layer}`;
}
