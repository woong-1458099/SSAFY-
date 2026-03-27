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
    buttons: "ui-buttons",
    emotion: "ui-emotion"
  },
  map: {
    fullTilesetImage: "map_tiles_full_asset",
    fullTilesetTsx: "map_tileset_full_tsx",
    classroomTilesetImage: "map_tiles_classroom_asset",
    classroomTilesetTsx: "map_tileset_classroom_tsx",
    worldTmx: "map_tmx_world",
    downtownTmx: "map_tmx_downtown",
    campusTmx: "map_tmx_campus",
    classroomTmx: "map_tmx_classroom"
  },
  story: {
    authoredDialogues: "story_authored_dialogues",
    authoredDialoguesCommon: "story_authored_dialogues_common",
    authoredDialoguesW1: "story_authored_dialogues_w1",
    authoredDialoguesW2: "story_authored_dialogues_w2",
    authoredDialoguesW3: "story_authored_dialogues_w3",
    authoredDialoguesW4: "story_authored_dialogues_w4",
    authoredDialoguesW5: "story_authored_dialogues_w5",
    authoredDialoguesW6: "story_authored_dialogues_w6",
    authoredSceneStates: "story_authored_scene_states"
  }
} as const;

export const ASSET_PATHS = {
  ui: {
    buttons: "/assets/game/ui/buttons.png",
    emotion: "/assets/game/ui/emotion.png"
  },
  map: {
    fullTilesetImage: "/assets/game/map/FullAsset.png",
    fullTilesetTsx: "/assets/game/map/FullTileSet.tsx",
    classroomTilesetImage: "/assets/game/map/inClass_Asset.png",
    classroomTilesetTsx: "/assets/game/map/inClass_Asset.tsx",
    worldTmx: "/assets/game/map/mainMap.tmx",
    downtownTmx: "/assets/game/map/city.tmx",
    campusTmx: "/assets/game/map/inSSAFY.tmx",
    classroomTmx: "/assets/game/map/classroom.tmx"
  },
  story: {
    authoredDialogues: "/assets/game/data/story/authored/dialogues.json",
    authoredDialoguesCommon: "/assets/game/data/story/authored/dialogues_common.json",
    authoredDialoguesW1: "/assets/game/data/story/authored/dialogues_w1.json",
    authoredDialoguesW2: "/assets/game/data/story/authored/dialogues_w2.json",
    authoredDialoguesW3: "/assets/game/data/story/authored/dialogues_w3.json",
    authoredDialoguesW4: "/assets/game/data/story/authored/dialogues_w4.json",
    authoredDialoguesW5: "/assets/game/data/story/authored/dialogues_w5.json",
    authoredDialoguesW6: "/assets/game/data/story/authored/dialogues_w6.json",
    authoredSceneStates: "/assets/game/data/story/authored/scene_states.json"
  }
} as const;

export type MapTilesetAssetDefinition = {
  source: string;
  imageKey: string;
  imagePath: string;
  tsxKey: string;
  tsxPath: string;
};

export const MAP_TILESET_ASSETS: MapTilesetAssetDefinition[] = [
  {
    source: "FullTileSet.tsx",
    imageKey: ASSET_KEYS.map.fullTilesetImage,
    imagePath: ASSET_PATHS.map.fullTilesetImage,
    tsxKey: ASSET_KEYS.map.fullTilesetTsx,
    tsxPath: ASSET_PATHS.map.fullTilesetTsx
  },
  {
    source: "inClass_Asset.tsx",
    imageKey: ASSET_KEYS.map.classroomTilesetImage,
    imagePath: ASSET_PATHS.map.classroomTilesetImage,
    tsxKey: ASSET_KEYS.map.classroomTilesetTsx,
    tsxPath: ASSET_PATHS.map.classroomTilesetTsx
  }
];

function normalizeMapTilesetSource(source: string) {
  const normalizedSource = source.replace(/\\/g, "/");
  const segments = normalizedSource.split("/");
  return segments[segments.length - 1]?.toLowerCase() ?? "";
}

export function getMapTilesetAssetBySource(source?: string) {
  if (!source) {
    return undefined;
  }

  const normalizedSource = normalizeMapTilesetSource(source);
  return MAP_TILESET_ASSETS.find((asset) => normalizeMapTilesetSource(asset.source) === normalizedSource);
}

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
