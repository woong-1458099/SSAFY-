import type { AreaId } from "../../../common/enums/area";

export type AreaTransitionId =
  | "world_to_campus"
  | "world_to_downtown"
  | "campus_to_world"
  | "downtown_to_world";

export type AreaTransitionDefinition = {
  id: AreaTransitionId;
  fromArea: AreaId;
  toArea: AreaId;
  label: string;
  tileX: number;
  tileY: number;
  tileWidth?: number;
  tileHeight?: number;
};

// 전이 포인트는 픽셀이 아니라 타일 기준 정적 정의로 유지한다.
export const AREA_TRANSITION_DEFINITIONS: Record<AreaTransitionId, AreaTransitionDefinition> = {
  world_to_campus: {
    id: "world_to_campus",
    fromArea: "world",
    toArea: "campus",
    label: "캠퍼스로 이동",
    tileX: 8,
    tileY: 4,
    tileWidth: 2,
    tileHeight: 1
  },
  world_to_downtown: {
    id: "world_to_downtown",
    fromArea: "world",
    toArea: "downtown",
    label: "번화가로 이동",
    tileX: 18,
    tileY: 4,
    tileWidth: 1,
    tileHeight: 1
  },
  campus_to_world: {
    id: "campus_to_world",
    fromArea: "campus",
    toArea: "world",
    label: "월드맵으로 이동",
    tileX: 0,
    tileY: 14,
    tileWidth: 1,
    tileHeight: 1
  },
  downtown_to_world: {
    id: "downtown_to_world",
    fromArea: "downtown",
    toArea: "world",
    label: "월드맵으로 이동",
    tileX: 3,
    tileY: 7,
    tileWidth: 1,
    tileHeight: 1
  }
};

export function getAreaTransitionDefinitions(areaId: AreaId) {
  return Object.values(AREA_TRANSITION_DEFINITIONS).filter((transition) => transition.fromArea === areaId);
}
