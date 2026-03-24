import { ASSET_KEYS } from "../../../common/assets/assetKeys";
import type { AreaId } from "../../../common/enums/area";
import type { Rect, Vector2 } from "../../../common/types/geometry";
import type { TmxAreaConfig } from "../../systems/tmxNavigation";

export type AreaMapDefinition = {
  entryPoint?: Vector2;
  tmxKey?: string;
  collisionLayerNames: string[];
  interactionLayerNames: string[];
  foregroundLayerNames: string[];
  walkableTileZones?: Rect[];
  blockedTileZones?: Rect[];
  blockedTiles?: Vector2[];
};

export type AreaBlockedOverlayDefinition = {
  tileRect: Rect;
  color: number;
  alpha: number;
};

export type AreaPresentationDefinition = {
  backgroundKey: string;
  npcScale?: number;
  blockedOverlays?: AreaBlockedOverlayDefinition[];
};

export type AreaDefinition = {
  id: AreaId;
  label: string;
  map: AreaMapDefinition;
  presentation: AreaPresentationDefinition;
};

// 지역별 값이 없을 때 사용할 NPC 기본 표시 배율이다.
export const DEFAULT_AREA_NPC_SCALE = 2.4;

const WORLD_BLOCKED_TILE_ZONES: Rect[] = [
  { x: 0, y: 0, width: 32, height: 4 }
];

const DOWNTOWN_BLOCKED_TILE_ZONES: Rect[] = [
  { x: 0, y: 0, width: 32, height: 4 }
];

const CAMPUS_BLOCKED_TILE_ZONES: Rect[] = [
  { x: 0, y: 0, width: 32, height: 11 }
];

export const AREA_DEFINITIONS: Record<AreaId, AreaDefinition> = {
  world: {
    id: "world",
    label: "전체 지도",
    map: {
      entryPoint: { x: 300, y: 360 },
      tmxKey: ASSET_KEYS.map.worldTmx,
      collisionLayerNames: ["root", "build"],
      interactionLayerNames: ["interaction(build)"],
      foregroundLayerNames: ["tree"],
      blockedTileZones: WORLD_BLOCKED_TILE_ZONES
    },
    presentation: {
      backgroundKey: ASSET_KEYS.background.world,
      npcScale: DEFAULT_AREA_NPC_SCALE
    }
  },
  downtown: {
    id: "downtown",
    label: "번화가",
    map: {
      entryPoint: { x: 216, y: 520 },
      tmxKey: ASSET_KEYS.map.downtownTmx,
      collisionLayerNames: ["tile layer 5(4)", "tile layer 3", "build(foul)", "collision(patch)"],
      interactionLayerNames: ["interaction(prompt)"],
      foregroundLayerNames: ["build(hide)"],
      blockedTileZones: DOWNTOWN_BLOCKED_TILE_ZONES
    },
    presentation: {
      backgroundKey: ASSET_KEYS.background.downtown,
      npcScale: DEFAULT_AREA_NPC_SCALE
    }
  },
  campus: {
    id: "campus",
    label: "캠퍼스",
    map: {
      entryPoint: { x: 220, y: 520 },
      tmxKey: ASSET_KEYS.map.campusTmx,
      collisionLayerNames: ["tile layer 4(2)", "tile layer 3"],
      interactionLayerNames: ["tile layer 2", "tile layer 4(2)"],
      foregroundLayerNames: [],
      blockedTileZones: CAMPUS_BLOCKED_TILE_ZONES
    },
    presentation: {
      backgroundKey: ASSET_KEYS.background.campus,
      npcScale: DEFAULT_AREA_NPC_SCALE,
      blockedOverlays: [
        {
          tileRect: { x: 0, y: 0, width: 32, height: 11 },
          color: 0x5a5f69,
          alpha: 0.88
        }
      ]
    }
  }
};

export function getAreaDefinition(areaId: AreaId) {
  return AREA_DEFINITIONS[areaId];
}

// 월드 로더가 맵 계약만 읽도록 별도 분리한다.
export function getAreaMapDefinition(areaId: AreaId) {
  return getAreaDefinition(areaId).map;
}

// 상호작용과 충돌 해석에 필요한 TMX 레이어 계약을 반환한다.
export function getAreaTmxConfig(areaId: AreaId): TmxAreaConfig | undefined {
  const map = getAreaMapDefinition(areaId);
  if (!map.tmxKey) {
    return undefined;
  }

  return {
    tmxKey: map.tmxKey,
    collisionLayerNames: map.collisionLayerNames,
    interactionLayerNames: map.interactionLayerNames,
    foregroundLayerNames: map.foregroundLayerNames
  };
}

export function getAreaEntryPoint(areaId: AreaId) {
  return getAreaMapDefinition(areaId).entryPoint;
}

export function getAreaNpcScale(areaId: AreaId) {
  return getAreaDefinition(areaId).presentation.npcScale ?? DEFAULT_AREA_NPC_SCALE;
}
