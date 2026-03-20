// 지역 라벨, 배경, 진입점, TMX 키, 레이어 이름 등 지역 구성 정의를 관리
import { ASSET_KEYS } from "../../../common/assets/assetKeys";
import type { AreaId } from "../../../common/enums/area";
import type { Vector2 } from "../../../common/types/geometry";

export type AreaDefinition = {
  id: AreaId;
  label: string;
  backgroundKey: string;
  entryPoint?: Vector2;
  tmxKey?: string;
  npcScale?: number;
  collisionLayerNames: string[];
  interactionLayerNames: string[];
  foregroundLayerNames: string[];
};

// 한 줄 한글 설명: 지역 설정이 없을 때 사용할 NPC 기본 표시 배율입니다.
export const DEFAULT_AREA_NPC_SCALE = 2.4;

// 한 줄 한글 설명: 지역에 값이 없으면 공통 NPC 배율을 사용합니다.
export function getAreaNpcScale(areaId: AreaId) {
  return AREA_DEFINITIONS[areaId]?.npcScale ?? DEFAULT_AREA_NPC_SCALE;
}

export const AREA_DEFINITIONS: Record<AreaId, AreaDefinition> = {
  world: {
    id: "world",
    label: "전체 지도",
    backgroundKey: ASSET_KEYS.background.world,
    tmxKey: ASSET_KEYS.map.worldTmx,
    npcScale: DEFAULT_AREA_NPC_SCALE,
    collisionLayerNames: ["root", "build"],
    interactionLayerNames: ["build"],
    foregroundLayerNames: ["tree"]
  },
  downtown: {
    id: "downtown",
    label: "번화가",
    backgroundKey: ASSET_KEYS.background.downtown,
    entryPoint: { x: 216, y: 520 },
    tmxKey: ASSET_KEYS.map.downtownTmx,
    npcScale: DEFAULT_AREA_NPC_SCALE,
    collisionLayerNames: ["tile layer 5(4)", "tile layer 3", "build(foul)"],
    interactionLayerNames: ["build(total)"],
    foregroundLayerNames: ["build(hide)"]
  },
  campus: {
    id: "campus",
    label: "캠퍼스",
    backgroundKey: ASSET_KEYS.background.campus,
    entryPoint: { x: 220, y: 520 },
    tmxKey: ASSET_KEYS.map.campusTmx,
    npcScale: DEFAULT_AREA_NPC_SCALE,
    collisionLayerNames: ["tile layer 4(2)", "tile layer 3"],
    interactionLayerNames: ["tile layer 2", "tile layer 4(2)"],
    foregroundLayerNames: []
  }
};
