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
  collisionLayerNames: string[];
  interactionLayerNames: string[];
  foregroundLayerNames: string[];
};

export const AREA_DEFINITIONS: Record<AreaId, AreaDefinition> = {
  world: {
    id: "world",
    label: "전체 지도",
    backgroundKey: ASSET_KEYS.background.world,
    tmxKey: ASSET_KEYS.map.worldTmx,
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
    collisionLayerNames: ["tile layer 4(2)", "tile layer 3"],
    interactionLayerNames: ["tile layer 2", "tile layer 4(2)"],
    foregroundLayerNames: []
  }
};
