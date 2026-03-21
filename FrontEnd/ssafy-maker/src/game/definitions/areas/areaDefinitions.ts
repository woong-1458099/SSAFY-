// 지역 라벨, 배경, 진입점, TMX 키, 레이어 이름 등 지역 구성 정의를 관리
import { ASSET_KEYS } from "../../../common/assets/assetKeys";
import type { AreaId } from "../../../common/enums/area";
import type { Vector2 } from "../../../common/types/geometry";
import type { TmxAreaConfig } from "../../systems/tmxNavigation";

export type AreaMapDefinition = {
  entryPoint?: Vector2;
  tmxKey?: string;
  collisionLayerNames: string[];
  interactionLayerNames: string[];
  foregroundLayerNames: string[];
};

export type AreaPresentationDefinition = {
  backgroundKey: string;
  npcScale?: number;
};

export type AreaDefinition = {
  id: AreaId;
  label: string;
  map: AreaMapDefinition;
  presentation: AreaPresentationDefinition;
};

// 한 줄 한글 설명: 지역 설정이 없을 때 사용할 NPC 기본 표시 배율입니다.
export const DEFAULT_AREA_NPC_SCALE = 2.4;

export const AREA_DEFINITIONS: Record<AreaId, AreaDefinition> = {
  world: {
    id: "world",
    label: "전체 지도",
    map: {
      tmxKey: ASSET_KEYS.map.worldTmx,
      collisionLayerNames: ["root", "build"],
      interactionLayerNames: ["build"],
      foregroundLayerNames: ["tree"]
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
      collisionLayerNames: ["tile layer 5(4)", "tile layer 3", "build(foul)"],
      interactionLayerNames: ["build(total)"],
      foregroundLayerNames: ["build(hide)"]
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
      foregroundLayerNames: []
    },
    presentation: {
      backgroundKey: ASSET_KEYS.background.campus,
      npcScale: DEFAULT_AREA_NPC_SCALE
    }
  }
};

export function getAreaDefinition(areaId: AreaId) {
  return AREA_DEFINITIONS[areaId];
}

// 한 줄 한글 설명: 월드 로더가 소비할 맵 계약만 별도로 꺼낸다.
export function getAreaMapDefinition(areaId: AreaId) {
  return getAreaDefinition(areaId).map;
}

// 한 줄 한글 설명: 상호작용과 충돌 해석에 필요한 TMX 레이어 계약을 반환한다.
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

// 한 줄 한글 설명: 지역에 값이 없으면 공통 NPC 배율을 사용합니다.
export function getAreaNpcScale(areaId: AreaId) {
  return getAreaDefinition(areaId).presentation.npcScale ?? DEFAULT_AREA_NPC_SCALE;
}
