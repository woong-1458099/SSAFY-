// 지역 진입 좌표만 따로 참조할 수 있도록 분리한 진입점 정의
import type { AreaId } from "../../../common/enums/area";
import type { Vector2 } from "../../../common/types/geometry";
import { AREA_DEFINITIONS } from "./areaDefinitions";

export const AREA_ENTRY_POINTS: Partial<Record<AreaId, Vector2>> = {
  downtown: AREA_DEFINITIONS.downtown.entryPoint,
  campus: AREA_DEFINITIONS.campus.entryPoint
};
