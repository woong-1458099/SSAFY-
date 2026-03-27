// 전체 지도 기본 상태는 맵 탐험 중심이라 NPC 없이 시작한다.
import type { SceneState } from "../../../common/types/sceneState";
import { SCENE_STATE_IDS } from "./sceneStateIds";

export const WORLD_DEFAULT_SCENE_STATE: SceneState = {
  id: SCENE_STATE_IDS.worldDefault,
  area: "world",
  npcs: []
};
